import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Emergency keywords ────────────────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'breathing difficulty', 'can\'t breathe',
  'unconscious', 'stroke', 'heavy bleeding', 'not breathing', 'collapsed',
  'seizure', 'overdose', 'severe pain', 'choking', 'fainted', 'blackout',
  // Hindi/Indian language variants
  'seene mein dard', 'saans nahi', 'behosh', 'bahut dard',
];

// ── Agent type detection ──────────────────────────────────────────────────────
function detectAgentType(speech: string): string {
  const s = speech.toLowerCase();

  if (/appoint|book|schedul|cancel|reschedul|slot|timing|date|time|doctor.*available|visit|opd/.test(s))
    return 'RECEPTIONIST';

  if (/symptom|pain|fever|cough|cold|vomit|diarrhea|dizzy|headache|bleeding|swelling|rash|hurt|sick|unwell|not feeling|problem with|trouble|issue/.test(s))
    return 'TRIAGE';

  if (/medicine|tablet|capsule|drug|dose|dosage|side effect|prescription|pharmacy|tablet.*name|what is.*medicine/.test(s))
    return 'PHARMACIST';

  if (/doctor|specialist|department|which doctor|which department|cardiolog|dermatolog|orthoped|gynecolog|neurolog|pediatric|general physician|ent|ophthalmol/.test(s))
    return 'CONSULTANT';

  if (/translate|language|hindi|kannada|tamil|telugu|malayalam|marathi|bengali|gujarati|speak in|tell me in/.test(s))
    return 'INTERPRETER';

  if (/summary|note|record|document|history|report|diagnos/.test(s))
    return 'SCRIBE';

  return 'RECEPTIONIST'; // default
}

// ── System prompts per agent ──────────────────────────────────────────────────
function getSystemPrompt(
  agentType: string,
  agentName: string,
  hospitalName: string,
  patientName: string,
  language: string,
): string {
  const langNote = language && language !== 'EN'
    ? `\n\nIMPORTANT: The patient prefers ${language}. Respond naturally in ${language} where possible, mixing with English only when needed for medical terms.`
    : '';

  const base = `You are ${agentName}, an AI healthcare assistant at ${hospitalName || 'our hospital'}.
You are speaking with ${patientName || 'a patient'} on a phone call.
Be warm, caring, and conversational — like a real hospital staff member.
Speak in short, clear sentences suitable for a phone call.
Never diagnose. Never prescribe. Always recommend consulting a doctor.${langNote}`;

  switch (agentType) {
    case 'RECEPTIONIST':
      return `${base}

You are the AI Receptionist. Your job is to help patients book, reschedule, or cancel appointments.

Flow — follow this naturally in conversation:
1. Greet and ask how you can help
2. Ask for patient name (if not known)
3. Ask which department or doctor they need
4. Ask preferred date and time
5. Confirm the appointment details
6. End warmly: "Your appointment has been noted. Our team will confirm it shortly."

Keep responses SHORT — 1-2 sentences at a time on a phone call.
If patient asks something medical, say "For that, let me connect you with our medical team, but first let me take care of your appointment."`;

    case 'TRIAGE':
      return `${base}

You are the AI Triage Nurse. Your job is to understand symptoms and assess urgency.

Ask these naturally one at a time:
- What symptoms are you experiencing?
- How long have you had these symptoms?
- How severe is the discomfort — mild, moderate, or severe?
- Do you have any existing conditions?

Based on answers:
- SEVERE/EMERGENCY: "Please go to the emergency room immediately or call 108."
- MODERATE: "I'd recommend seeing a doctor today. I can book an appointment."  
- MILD: "This sounds manageable. Let me book you an appointment with the right specialist."

Never diagnose. Always end with a recommendation to see a doctor.
Keep each response to 1-2 sentences.`;

    case 'PHARMACIST':
      return `${base}

You are the AI Pharmacist. Provide general medicine information only.

Rules:
- Explain what a medicine is generally used for
- Mention common general side effects if asked
- ALWAYS say: "Please take this medicine only as prescribed by your doctor."
- NEVER prescribe medicines or dosages
- If asked about drug interactions: "Please consult your doctor or pharmacist in person for this."

Keep responses short and clear. One topic at a time.`;

    case 'CONSULTANT':
      return `${base}

You are the AI Medical Consultant. Help patients find the right department or doctor type.

Examples:
- Heart issues → Cardiologist
- Skin problems → Dermatologist  
- Bone/joint pain → Orthopedic surgeon
- Children → Pediatrician
- Eye problems → Ophthalmologist
- Ear/Nose/Throat → ENT specialist
- General illness → General Physician
- Women's health → Gynecologist
- Brain/nerves → Neurologist

After suggesting the department, offer: "Would you like me to book an appointment with that department?"
Never diagnose. Keep it simple and helpful.`;

    case 'INTERPRETER':
      return `${base}

You are the AI Interpreter. Help patients in their preferred language.
Detect the language from what the patient says and respond in that language.
Maintain medical accuracy while translating.
Keep the tone warm and professional.
If you're not sure of a medical term in their language, use the English term clearly.`;

    case 'SCRIBE':
      return `${base}

You are the AI Medical Scribe. Help document patient information in a structured way.
Ask for: patient name, age, gender, main symptoms, duration, and any existing conditions.
Summarize clearly and professionally.
Tell the patient: "I've noted your details. Our medical team will review this before your appointment."`;

    default:
      return base;
  }
}

// ── Extract appointment data from conversation ────────────────────────────────
function extractAppointmentData(messages: { role: string; content: string }[]): Record<string, string> {
  const fullText = messages.map(m => m.content).join(' ').toLowerCase();
  const data: Record<string, string> = {};

  // Extract department mentions
  const depts = ['cardiology', 'dermatology', 'orthopedic', 'pediatric', 'general physician', 'gynecology', 'neurology', 'ent', 'ophthalmology', 'emergency'];
  for (const dept of depts) {
    if (fullText.includes(dept)) { data.department = dept; break; }
  }

  // Extract time mentions
  const timeMatch = fullText.match(/(\d{1,2})\s*(am|pm|o'clock)/);
  if (timeMatch) data.preferredTime = timeMatch[0];

  // Extract date mentions
  const dateMatch = fullText.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}(st|nd|rd|th)?)/);
  if (dateMatch) data.preferredDate = dateMatch[0];

  return data;
}

// ── Extract triage data ───────────────────────────────────────────────────────
function extractTriageData(messages: { role: string; content: string }[]): Record<string, string> {
  const fullText = messages.map(m => m.content).join(' ').toLowerCase();
  const data: Record<string, string> = {};

  const severityMatch = fullText.match(/\b(mild|moderate|severe|critical|extreme|bad|little|slight)\b/);
  if (severityMatch) data.severity = severityMatch[0];

  const durationMatch = fullText.match(/(\d+)\s*(day|hour|week|month)/);
  if (durationMatch) data.duration = durationMatch[0];

  return data;
}

// ── Main hospital brain function ──────────────────────────────────────────────
export async function generateHospitalResponse(params: {
  userSpeech:   string;
  agentName:    string;
  hospitalName: string;
  patientName?: string;
  language:     string;
  callHistory:  { role: string; content: string }[];
  callSid:      string;
}): Promise<{
  aiText:        string;
  twiml:         string;
  shouldHangup:  boolean;
  agentType:     string;
  isEmergency:   boolean;
  appointmentData?: Record<string, string>;
  triageData?:      Record<string, string>;
  patientNotes?:    string;
}> {
  const { userSpeech, agentName, hospitalName, patientName, language, callHistory } = params;

  // ── Emergency detection — check before anything else ─────────────────────
  const speechLower = userSpeech.toLowerCase();
  const isEmergency = EMERGENCY_KEYWORDS.some(kw => speechLower.includes(kw));

  if (isEmergency) {
    const emergencyText = `This sounds like a medical emergency. Please call 108 immediately or go to the nearest emergency room right now. Do not wait. Please call 108 immediately.`;
    const twiml = buildTwiml(emergencyText, true);
    return { aiText: emergencyText, twiml, shouldHangup: true, agentType: 'EMERGENCY', isEmergency: true };
  }

  // ── Detect which agent to use ─────────────────────────────────────────────
  const agentType = detectAgentType(userSpeech);
  const systemPrompt = getSystemPrompt(agentType, agentName, hospitalName, patientName ?? 'the patient', language);

  // ── Build messages for Groq ───────────────────────────────────────────────
  const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...callHistory.slice(-8).map(m => ({  // Keep last 8 for context
      role:    (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userSpeech },
  ];

  // ── Call Groq ─────────────────────────────────────────────────────────────
  let aiText = '';
  try {
    const response = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages,
      max_tokens:  120,      // Short for phone calls
      temperature: 0.7,
    });
    aiText = response.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[Hospital Brain] Groq error:', err);
    aiText = `I'm sorry, I'm having a little trouble right now. Please hold on, and one of our staff will assist you shortly.`;
  }

  // Fallback
  if (!aiText) {
    aiText = `I'm sorry, could you please repeat that? I want to make sure I help you correctly.`;
  }

  // ── Detect hangup intent ──────────────────────────────────────────────────
  const hangupPhrases = ['goodbye', 'bye', 'thank you goodbye', 'that\'s all', 'nothing else', 'all done', 'thanks bye'];
  const shouldHangup = hangupPhrases.some(p => speechLower.includes(p)) && callHistory.length > 2;

  // ── Build TwiML ───────────────────────────────────────────────────────────
  const twiml = buildTwiml(aiText, shouldHangup);

  // ── Extract structured data for DB storage ────────────────────────────────
  const allMessages = [...callHistory, { role: 'user', content: userSpeech }, { role: 'assistant', content: aiText }];
  const appointmentData = agentType === 'RECEPTIONIST' ? extractAppointmentData(allMessages) : undefined;
  const triageData      = agentType === 'TRIAGE'       ? extractTriageData(allMessages)       : undefined;
  const patientNotes    = agentType === 'SCRIBE'        ? aiText                               : undefined;

  return {
    aiText, twiml, shouldHangup,
    agentType, isEmergency: false,
    appointmentData, triageData, patientNotes,
  };
}

// ── Build TwiML response ──────────────────────────────────────────────────────
function buildTwiml(text: string, hangup: boolean): string {
  // Clean text for TwiML — remove markdown, special chars
  const clean = text
    .replace(/[*_`#]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

  if (hangup) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${clean}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">Thank you for calling. Take care and get well soon. Goodbye!</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${clean}</Say>
  <Gather
    input="speech"
    action="/api/twilio/gather"
    method="POST"
    speechTimeout="2"
    speechModel="phone_call"
    enhanced="true"
    timeout="8"
  >
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I didn't catch that. Could you please repeat?</Say>
  <Gather
    input="speech"
    action="/api/twilio/gather"
    method="POST"
    speechTimeout="2"
    timeout="8"
  >
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Hangup/>
</Response>`;
}

// ── Hospital greeting TwiML (for inbound/outbound call start) ─────────────────
export function buildHospitalGreeting(agentName: string, hospitalName: string, patientName?: string): string {
  const greeting = patientName
    ? `Hello ${patientName}, this is ${agentName} calling from ${hospitalName || 'the hospital'}. How are you doing today? How can I help you?`
    : `Thank you for calling ${hospitalName || 'the hospital'}. This is ${agentName}, your AI health assistant. How can I help you today?`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${greeting}</Say>
  <Gather
    input="speech"
    action="/api/twilio/gather"
    method="POST"
    speechTimeout="2"
    speechModel="phone_call"
    enhanced="true"
    timeout="10"
  >
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I'm here to help. Please go ahead and tell me how I can assist you.</Say>
  <Gather
    input="speech"
    action="/api/twilio/gather"
    method="POST"
    speechTimeout="2"
    timeout="10"
  >
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Hangup/>
</Response>`;
}