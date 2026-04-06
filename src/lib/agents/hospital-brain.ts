import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Emergency keywords (English + Hindi + Kannada) ────────────────────────────
const EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack', 'cant breathe', "can't breathe", 'not breathing',
    'breathing difficulty', 'unconscious', 'stroke', 'heavy bleeding', 'collapsed',
    'seizure', 'overdose', 'choking', 'fainted', 'blackout', 'cardiac arrest',
    'no pulse', 'severe bleeding', 'head injury', 'not responding',
    'seene mein dard', 'saans nahi aa raha', 'behosh ho gaya', 'bahut zyada khoon',
    'nenu breathe chesuko lekapoyatam ledu', 'channagilla', 'ulbana',
];

// ── Detect which of the 6 sub-agents should respond ──────────────────────────
function detectSubAgent(speech: string, history: { role: string; content: string }[]): string {
    const s = speech.toLowerCase();

    // Appointment / scheduling
    if (/appoint|book|schedul|cancel|reschedul|slot|timing|available|visit|opd|check.?up|consult|see.*doctor|meet.*doctor/.test(s))
        return 'RECEPTIONIST';

    // Symptoms / triage
    if (/symptom|pain|fever|cough|cold|vomit|nausea|diarrhea|dizzy|headache|bleed|swell|rash|hurt|sick|unwell|not feel|weak|tired|burning|itching|infection|wound|injury|problem|trouble/.test(s))
        return 'TRIAGE';

    // Medicines
    if (/medicine|tablet|capsule|drug|dose|dosage|side effect|prescription|paracetamol|aspirin|antibiotic|strip|syrup|injection|ointment|cream|what.*tablet|which.*medicine/.test(s))
        return 'PHARMACIST';

    // Doctor / department suggestion
    if (/which doctor|which department|what specialist|cardiolog|dermatolog|orthoped|gynecolog|neurolog|pediatric|general physician|ent|ophthalmol|urolog|gastro|pulmonolog|oncolog|psychiatr|endocrin|rheumatolog/.test(s))
        return 'CONSULTANT';

    // Language
    if (/hindi mein|kannada|tamil|telugu|malayalam|marathi|bengali|punjabi|gujarati|speak.*language|translate|respond.*hindi|mujhe hindi/.test(s))
        return 'INTERPRETER';

    // Notes / documentation
    if (/note|summary|document|record|history|report|write down|keep.*record/.test(s))
        return 'SCRIBE';

    // If conversation already started and context is medical, default to triage
    if (history.length > 2) return 'TRIAGE';

    return 'RECEPTIONIST';
}

// ── Master system prompt — all 7 agents built in ─────────────────────────────
function buildMasterPrompt(
    agentName: string,
    hospitalName: string,
    patientName: string,
    subAgent: string,
    language: string,
): string {
    const name = patientName ? patientName : 'the patient';
    const hosp = hospitalName || 'City Hospital';
    const langLine = (language && language !== 'EN')
        ? `\nIMPORTANT: Patient prefers ${language}. Mix ${language} with English naturally for medical terms.`
        : '';

    const base = `You are ${agentName}, an AI healthcare assistant at ${hosp}.
You are on a PHONE CALL with ${name}.
Speak exactly like a warm, caring Indian hospital staff member would on a phone call.
Keep EVERY response to 1-2 short sentences only — this is a voice call.
Never use bullet points, lists, asterisks, or any formatting.
Never diagnose any condition. Never prescribe medicines.
Always recommend consulting a doctor for medical decisions.
Be conversational, empathetic, and professional.${langLine}`;

    switch (subAgent) {

        case 'RECEPTIONIST':
            return `${base}

You are the AI Receptionist at ${hosp}.
Your only job is to help patients book, reschedule, or cancel appointments.

Follow this natural conversation flow:
- First ask: "May I know your name please?"
- Then: "Which department or which doctor would you like to see?"
- Then: "What date and time would be convenient for you?"
- Then confirm: "I have noted your appointment for [department] on [date] at [time]. Our team will confirm this shortly."
- Close warmly: "Is there anything else I can help you with today?"

If patient mentions symptoms, say: "I understand. Let me first note your appointment, and the doctor will assess your condition when you visit."
Never diagnose. Stay focused on booking.`;

        case 'TRIAGE':
            return `${base}

You are the AI Triage Nurse at ${hosp}.
Your job is to understand the patient's symptoms and guide them to the right care.

Ask these questions one at a time naturally:
1. "Can you tell me what symptoms you are experiencing?"
2. "How long have you been feeling this way?"
3. "Would you say the discomfort is mild, moderate, or severe?"
4. "Do you have any existing health conditions like diabetes or blood pressure?"

After gathering symptoms, respond with:
- If urgent: "Based on what you've told me, I'd recommend you visit the hospital today. Shall I help you book an urgent appointment?"
- If moderate: "This sounds like something a doctor should check. I can book an appointment for you — which day works best?"
- If mild: "I understand. A doctor can help you feel better. Would you like me to book a convenient appointment?"

Never diagnose. Always end by offering to connect with a doctor.`;

        case 'PHARMACIST':
            return `${base}

You are the AI Pharmacist at ${hosp}.
You provide general medicine information only.

Rules you must follow every time:
- Explain what a medicine is generally used for in simple words
- Mention only very common, general side effects if asked
- ALWAYS add: "Please only take this as prescribed by your doctor."
- NEVER suggest a dose or quantity
- NEVER say "take this medicine for your condition"
- For interactions: "Please speak with our pharmacist in person for that."

Be simple, clear, and reassuring. One topic per response.`;

        case 'CONSULTANT':
            return `${base}

You are the AI Medical Consultant at ${hosp}.
Your job is to help patients find the right department or doctor.

Department guide:
- Heart / chest issues → Cardiology
- Skin / hair / nail → Dermatology
- Bone / joint / back → Orthopaedics
- Children under 15 → Paediatrics
- Eyes → Ophthalmology
- Ear / nose / throat → ENT
- Stomach / digestion → Gastroenterology
- Kidney → Nephrology / Urology
- Brain / nerves → Neurology
- Women's health → Gynaecology
- Lung / breathing → Pulmonology
- General illness → General Physician
- Mental health → Psychiatry

After suggesting: "Would you like me to book an appointment with that department today?"
Never diagnose. Keep explanations simple and reassuring.`;

        case 'INTERPRETER':
            return `${base}

You are the AI Interpreter at ${hosp}.
Detect the language the patient is using and respond naturally in that same language.
Mix English only for medical terms that have no simple translation.
Keep the same warm, professional hospital tone.
Maintain complete medical accuracy while speaking their language.`;

        case 'SCRIBE':
            return `${base}

You are the AI Medical Scribe at ${hosp}.
Help capture the patient's information clearly.

Ask these one at a time:
- "May I have your full name?"
- "What is your age?"
- "What are your main symptoms today?"
- "How long have you had these symptoms?"
- "Do you have any existing medical conditions?"

After collecting: "Thank you. I have noted your details. Our medical team will review this before your appointment."`;

        default:
            return `${base}

You are a helpful AI health assistant at ${hosp}.
Greet the patient warmly and ask: "How may I assist you today?"
Based on their response, help them with appointments, symptoms, medicines, or finding the right doctor.
Keep responses short and conversational for a phone call.`;
    }
}

// ── Main hospital voice response ──────────────────────────────────────────────
export async function generateHospitalVoiceResponse(params: {
    userSpeech: string;
    agentName: string;
    hospitalName: string;
    patientName?: string;
    language: string;
    callHistory: { role: string; content: string }[];
}): Promise<{
    aiText: string;
    twiml: string;
    shouldHangup: boolean;
    subAgent: string;
    isEmergency: boolean;
}> {
    const { userSpeech, agentName, hospitalName, patientName, language, callHistory } = params;
    const speechLower = userSpeech.toLowerCase();

    // ── 1. Emergency check — always first ──────────────────────────────────────
    const isEmergency = EMERGENCY_KEYWORDS.some(kw => speechLower.includes(kw));
    if (isEmergency) {
        const emergencyText = `This sounds very serious. Please call 108 immediately or go to the nearest emergency room right now. Please call 108 right away. Do not wait.`;
        return {
            aiText: emergencyText,
            twiml: makeTwiml(emergencyText, true),
            shouldHangup: true,
            subAgent: 'EMERGENCY',
            isEmergency: true,
        };
    }

    // ── 2. Detect sub-agent ────────────────────────────────────────────────────
    const subAgent = detectSubAgent(userSpeech, callHistory);
    const systemPrompt = buildMasterPrompt(agentName, hospitalName, patientName ?? '', subAgent, language);

    // ── 3. Build Groq messages ─────────────────────────────────────────────────
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...callHistory.slice(-10).map(m => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
        })),
        { role: 'user', content: userSpeech },
    ];

    // ── 4. Call Groq ───────────────────────────────────────────────────────────
    let aiText = '';
    try {
        const res = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 150,
            temperature: 0.65,
        });
        aiText = res.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
        console.error('[Hospital Brain] Groq error:', err);
        aiText = `I'm sorry, I'm having a little difficulty. Please hold on, and one of our staff will assist you right away.`;
    }

    if (!aiText) {
        aiText = `I didn't quite catch that. Could you please say that again?`;
    }

    // ── 5. Detect call end ─────────────────────────────────────────────────────
    const endPhrases = ['bye', 'goodbye', 'thank you bye', "that's all", 'nothing else', 'ok bye', 'thanks bye', 'no thank you'];
    const shouldHangup = callHistory.length > 2 && endPhrases.some(p => speechLower.includes(p));

    return {
        aiText,
        twiml: makeTwiml(aiText, shouldHangup),
        shouldHangup,
        subAgent,
        isEmergency: false,
    };
}

// ── Build hospital greeting TwiML ─────────────────────────────────────────────
export function buildHospitalGreeting(agentName: string, hospitalName: string, patientName?: string): string {
    const hosp = hospitalName || 'the hospital';
    const greeting = patientName
        ? `Hello ${patientName}! This is ${agentName} calling from ${hosp}. How are you feeling today? How can I help you?`
        : `Thank you for calling ${hosp}. This is ${agentName}, your AI health assistant. How may I help you today?`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${xmlEscape(greeting)}</Say>
  <Gather input="speech" action="/api/twilio/gather" method="POST"
    speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="10">
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I'm here to help you. Please go ahead.</Say>
  <Gather input="speech" action="/api/twilio/gather" method="POST"
    speechTimeout="2" timeout="10">
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Hangup/>
</Response>`;
}

// ── TwiML builder ─────────────────────────────────────────────────────────────
function makeTwiml(text: string, hangup: boolean): string {
    const clean = xmlEscape(text.replace(/[*_`#\-•]/g, '').replace(/\n+/g, ' ').trim());

    if (hangup) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${clean}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">Thank you for calling. Please take care and stay safe. Goodbye!</Say>
  <Hangup/>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${clean}</Say>
  <Gather input="speech" action="/api/twilio/gather" method="POST"
    speechTimeout="2" speechModel="phone_call" enhanced="true" timeout="8">
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I didn't catch that. Could you please repeat?</Say>
  <Gather input="speech" action="/api/twilio/gather" method="POST"
    speechTimeout="2" timeout="8">
    <Say voice="Polly.Aditi" language="en-IN"> </Say>
  </Gather>
  <Hangup/>
</Response>`;
}

function xmlEscape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}