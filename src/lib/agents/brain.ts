import Groq from 'groq-sdk';
import type { AgentContext, AgentResponse, QuickAction } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Detect which hospital sub-agent ──────────────────────────────────────────
function detectSubAgent(message: string, history: { role: string; content: string }[]): string {
  const s = message.toLowerCase();
  if (/appoint|book|schedul|cancel|reschedul|slot|timing|available|visit|opd|check.?up|when.*doctor|see.*doctor/.test(s)) return 'RECEPTIONIST';
  if (/symptom|pain|fever|cough|cold|vomit|nausea|diarrhea|dizzy|headache|bleed|swell|rash|hurt|sick|unwell|not feel|weak|tired|burning|infection|breathless/.test(s)) return 'TRIAGE';
  if (/medicine|tablet|capsule|drug|dose|dosage|side effect|prescription|paracetamol|aspirin|antibiotic|syrup|injection/.test(s)) return 'PHARMACIST';
  if (/which doctor|which department|specialist|cardiolog|dermatolog|orthoped|gynecolog|neurolog|pediatric|general physician|ent|ophthalmol/.test(s)) return 'CONSULTANT';
  if (history.length > 2) return 'TRIAGE';
  return 'RECEPTIONIST';
}

// ── Emergency detection ───────────────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', "can't breathe", 'cant breathe', 'not breathing',
  'breathing difficulty', 'unconscious', 'stroke', 'heavy bleeding', 'collapsed',
  'seizure', 'overdose', 'choking', 'fainted', 'blackout', 'cardiac arrest',
];

// ── Build hospital system prompt ──────────────────────────────────────────────
function buildSystemPrompt(
  agentName: string, hospitalName: string, subAgent: string,
  patientName: string, channel: string,
): string {
  const patient  = patientName || 'the patient';
  const hospital = hospitalName || 'City Hospital';

  const core = `You are ${agentName}, an AI healthcare assistant at ${hospital}.
You are helping ${patient} via ${channel}.

ABSOLUTE RULES — NEVER BREAK THESE:
- You are a HOSPITAL assistant ONLY — never a sales agent
- NEVER ask about budget, cost, project cost, revenue, or money
- NEVER use BANT (Budget, Authority, Need, Timeline) qualification
- NEVER pitch any product, service, or business deal
- NEVER say anything related to sales
- NEVER diagnose any medical condition
- NEVER prescribe medicines or dosages
- Keep every response to 2-3 sentences maximum
- Be warm, caring, and professional like real hospital staff
- Always recommend consulting a doctor for medical decisions`;

  switch (subAgent) {
    case 'RECEPTIONIST':
      return `${core}

You are the Hospital Receptionist at ${hospital}.
Your ONLY job is helping patients book, reschedule, or cancel appointments.

Ask ONE question at a time in this order:
1. "May I know your full name please?"
2. "Which department or doctor would you like to see?"
3. "What date and time would be convenient for you?"
4. Confirm: "I've noted your appointment for [department] on [date] at [time]. Our team will confirm this with you shortly."

If patient mentions symptoms, say: "I understand. Let me note your appointment first, and the doctor will assess you during the visit."
Never ask about budget or any sales topic.`;

    case 'TRIAGE':
      return `${core}

You are the Hospital Triage Nurse at ${hospital}.
Understand symptoms and guide the patient to the right care.

Ask ONE question at a time:
1. "What symptoms are you experiencing?"
2. "How long have you had these symptoms?"
3. "Would you say the discomfort is mild, moderate, or severe?"
4. "Do you have any existing conditions like diabetes or blood pressure?"

After understanding:
- Urgent → "I'd recommend visiting us today. Shall I help book an urgent appointment?"
- Moderate → "A doctor should check this. Which day works for an appointment?"
- Mild → "A doctor can help. Would you like to book an appointment?"

If emergency symptoms (chest pain, breathing difficulty, heavy bleeding) → respond: "This sounds serious. Please call 108 immediately or go to the nearest emergency room."`;

    case 'PHARMACIST':
      return `${core}

You are the Hospital Pharmacist at ${hospital}.
Provide general medicine information ONLY.
- Explain what a medicine is generally used for
- Mention only very common side effects if asked
- ALWAYS say: "Please take this only as prescribed by your doctor."
- NEVER suggest doses. NEVER tell patient to take any medicine.`;

    case 'CONSULTANT':
      return `${core}

You are the Hospital Medical Consultant at ${hospital}.
Help patients find the right department or doctor.

Heart/chest → Cardiology | Skin → Dermatology | Bones/joints → Orthopaedics
Children → Paediatrics | Eyes → Ophthalmology | Ear/nose/throat → ENT
Stomach → Gastroenterology | Brain/nerves → Neurology | Women's health → Gynaecology
Lungs → Pulmonology | General illness → General Physician | Mental health → Psychiatry

After suggesting: "Would you like me to book an appointment with that department today?"`;

    default:
      return `${core}

Greet warmly and ask: "How may I assist you today?"
Help with appointments, symptoms, medicines, or finding the right doctor.
You represent ${hospital} — a caring, professional healthcare institution.`;
  }
}

// ── Main chat function ────────────────────────────────────────────────────────
export async function processAgentMessage(
  message: string,
  context: AgentContext,
): Promise<AgentResponse> {
  const { agent, lead, conversationHistory, channel } = context;

  const agentAny     = agent as any;
  const hospitalName = agentAny.companyName ?? agentAny.organization?.name ?? process.env.HOSPITAL_NAME ?? 'City Hospital';
  const patientName  = lead ? `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() : '';

  // Emergency check first
  const msgLower     = message.toLowerCase();
  const isEmergency  = EMERGENCY_KEYWORDS.some(kw => msgLower.includes(kw));

  const subAgent     = detectSubAgent(message, conversationHistory);
  const systemPrompt = buildSystemPrompt(agent.name, hospitalName, subAgent, patientName, channel);

  // Build messages
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...conversationHistory.slice(-10).map(m => ({
      role:    (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // Call Groq
  let responseText = '';
  try {
    const res = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      max_tokens:  300,
      temperature: 0.65,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });
    responseText = res.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[Brain] Groq error:', err);
    responseText = `I'm here to help you. Could you please tell me how I can assist you today?`;
  }

  if (!responseText) {
    responseText = `I'm here to help. How may I assist you today?`;
  }

  // Emergency override
  if (isEmergency) {
    responseText = `⚠️ This sounds like a medical emergency. Please call **108** immediately or go to the nearest emergency room right now. Do not wait.`;
  }

  // Build quick actions
  const quickActions: QuickAction[] = [];
  const leadUpdates: Record<string, unknown> = {};
  let shouldBookMeeting = false;
  let shouldEscalate    = false;

  if (isEmergency) {
    quickActions.push({ id: 'emergency', label: '🚨 Call Emergency: 108', action: 'emergency' } as any);
    leadUpdates.tier   = 'HOT';
    leadUpdates.status = 'ENGAGED';
  }

  if (responseText.toLowerCase().includes('appointment') && responseText.toLowerCase().includes('noted')) {
    shouldBookMeeting = true;
    leadUpdates.status = 'MEETING_SET';
    quickActions.push({ id: 'appointment', label: '📅 Confirm Appointment', action: 'book_appointment' } as any);
  }

  if (responseText.toLowerCase().includes('connect you') || responseText.toLowerCase().includes('transfer')) {
    shouldEscalate = true;
    quickActions.push({ id: 'escalate', label: '👤 Connect to Hospital Staff', action: 'escalate' } as any);
  }

  return {
    message:          responseText,
    quickActions,
    leadUpdates:      Object.keys(leadUpdates).length > 0 ? leadUpdates : undefined,
    shouldQualify:    false,
    shouldBookMeeting,
    shouldEscalate,
  };
}



// //import OpenAI from 'openai';
// import type { AgentContext, AgentResponse, ToolCall, QuickAction } from '@/types';
// import { calculateLeadTier } from '@/lib/utils';

// // const openai = new OpenAI({
// //   apiKey: process.env.OPENAI_API_KEY,
// // });

// import Groq from 'groq-sdk';
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const AGENT_TOOLS = [
//     {
//         type: 'function',
//         function: {
//             name: 'qualify_lead',
//             description: 'Qualify a lead using BANT framework. Call this when you have gathered information about at least 2 BANT criteria.',
//             parameters: {
//                 type: 'object',
//                 properties: {
//                     budgetScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Budget (0-25)' },
//                     budgetNotes: { type: 'string', description: 'Notes about budget' },
//                     authorityScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Authority (0-25)' },
//                     authorityNotes: { type: 'string', description: 'Notes about decision maker' },
//                     needScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Need (0-25)' },
//                     needNotes: { type: 'string', description: 'Notes about business need' },
//                     timelineScore: { type: 'number', minimum: 0, maximum: 25, description: 'Score for Timeline (0-25)' },
//                     timelineNotes: { type: 'string', description: 'Notes about timeline' },
//                     painPoints: { type: 'array', items: { type: 'string' }, description: 'List of identified pain points' },
//                     buyingSignals: { type: 'array', items: { type: 'string' }, description: 'List of buying signals observed' },
//                     qualificationSummary: { type: 'string', description: 'Overall qualification summary' },
//                 },
//                 required: ['budgetScore', 'authorityScore', 'needScore', 'timelineScore'],
//             },
//         },
//     },
//     {
//         type: 'function',
//         function: {
//             name: 'book_meeting',
//             description: 'Suggest booking a meeting when the lead is qualified and shows strong interest.',
//             parameters: {
//                 type: 'object',
//                 properties: {
//                     reason: { type: 'string', description: 'Why a meeting is recommended' },
//                     suggestedTime: { type: 'string', description: 'Suggested meeting time or timeframe' },
//                 },
//                 required: ['reason'],
//             },
//         },
//     },
//     {
//         type: 'function',
//         function: {
//             name: 'escalate_to_human',
//             description: 'Escalate to a human sales rep when the lead requests it or the situation is too complex.',
//             parameters: {
//                 type: 'object',
//                 properties: {
//                     reason: { type: 'string', description: 'Why escalation is needed' },
//                 },
//                 required: ['reason'],
//             },
//         },
//     },
// ];

// export async function processAgentMessage(
//     message: string,
//     context: AgentContext
// ): Promise<AgentResponse> {
//     const { agent, lead, conversationHistory, channel } = context;

//     // Build a rich system prompt
//     const systemPrompt = `You are ${agent.name}, an expert AI Hospital AI Assistant.

// YOUR ROLE: ${agent.role}
// ${(agent as any).systemPrompt ? `\nSPECIAL INSTRUCTIONS: ${(agent as any).systemPrompt}` : ''}

// YOUR GOAL: Qualify leads using the BANT framework (Budget, Authority, Need, Timeline) and book meetings with qualified prospects.

// GUIDELINES:
// - Be conversational, warm, and professional
// - Ask one question at a time — never overwhelm the lead
// - Listen carefully and acknowledge what they say before asking the next question
// - Keep responses concise — 2 to 3 sentences maximum
// - Naturally gather BANT information through conversation
// - When you have enough info (2+ BANT criteria), call the qualify_lead tool
// - When a lead shows strong buying intent, suggest booking a meeting
// - If asked to speak to a human, use the escalate_to_human tool

// CHANNEL: ${channel}

// ${lead
//             ? `LEAD CONTEXT:
// - Name: ${lead.firstName ?? 'Unknown'} ${lead.lastName ?? ''}
// - Email: ${lead.email}
// - Company: ${lead.company ?? 'Unknown'}
// - Current Score: ${lead.score}/100
// - Status: ${lead.status}
// ${(lead as any).qualificationNotes ? `- Previous Notes: ${(lead as any).qualificationNotes}` : ''}
// ${lead.painPoints?.length ? `- Known Pain Points: ${lead.painPoints.join(', ')}` : ''}`
//             : 'NEW VISITOR: You do not know their name yet. Start by introducing yourself warmly and ask how you can help.'
//         }`;

//     // Build message history for context
//     const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
//         { role: 'system', content: systemPrompt },
//         // Include last 10 messages for context window efficiency
//         ...conversationHistory.slice(-10).map((m) => ({
//             role: m.role as 'user' | 'assistant',
//             content: m.content,
//         })),
//         { role: 'user', content: message },
//     ];

//     // Call OpenAI
//     //   const response = await openai.chat.completions.create({
//     //     model: process.env.OPENAI_MODEL ?? 'gpt-4o',
//     //     messages,
//     //     tools: AGENT_TOOLS,
//     //     tool_choice: 'auto',
//     //     max_tokens: 300,
//     //     temperature: 0.7,
//     //   });

//     const response = await groq.chat.completions.create({
//         model: 'llama-3.3-70b-versatile',  // free, fast, excellent for sales
//         messages,
//         tools: AGENT_TOOLS,
//         tool_choice: 'auto',
//         max_tokens: 300,
//         temperature: 0.7,
//     });

//     const choice = response.choices[0];
//     const toolCalls: ToolCall[] = [];
//     const quickActions: QuickAction[] = [];
//     let shouldQualify = false;
//     let shouldBookMeeting = false;
//     let shouldEscalate = false;
//     let leadUpdates: Record<string, unknown> = {};

//     // Process tool calls if any
//     if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
//         for (const tc of choice.message.tool_calls) {
//             const args = JSON.parse(tc.function.arguments);
//             toolCalls.push({ id: tc.id, name: tc.function.name, arguments: args });

//             if (tc.function.name === 'qualify_lead') {
//                 shouldQualify = true;
//                 const score =
//                     (args.budgetScore ?? 0) +
//                     (args.authorityScore ?? 0) +
//                     (args.needScore ?? 0) +
//                     (args.timelineScore ?? 0);

//                 leadUpdates = {
//                     score,
//                     tier: calculateLeadTier(score),
//                     qualificationNotes: args.qualificationSummary ?? '',
//                     painPoints: args.painPoints ?? [],
//                     buyingSignals: args.buyingSignals ?? [],
//                     status: score >= 60 ? 'QUALIFIED' : 'ENGAGED',
//                 };

//                 quickActions.push({
//                     id: 'qualify',
//                     label: `✅ Lead Scored ${score}/100`,
//                     action: 'qualify',
//                 });
//             }

//             if (tc.function.name === 'book_meeting') {
//                 shouldBookMeeting = true;
//                 quickActions.push({
//                     id: 'meeting',
//                     label: '📅 Book a Meeting',
//                     action: 'book_meeting',
//                 });
//             }

//             if (tc.function.name === 'escalate_to_human') {
//                 shouldEscalate = true;
//                 quickActions.push({
//                     id: 'escalate',
//                     label: '👤 Connect with Human',
//                     action: 'escalate',
//                 });
//             }
//         }
//     }

//     // Get the text response
//     const responseMessage =
//         choice.message.content ??
//         "I'm here to help! Could you tell me a bit more about what you're looking for?";

//     return {
//         message: responseMessage,
//         shouldQualify,
//         shouldBookMeeting,
//         shouldEscalate,
//         toolCalls,
//         leadUpdates,
//         quickActions,
//     };
// }