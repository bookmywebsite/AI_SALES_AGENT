import twilio from 'twilio';
import Groq from 'groq-sdk';

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MakeCallOptions {
    to: string; // lead phone number e.g. +919876543210
    agentId: string;
    leadId?: string;
    organizationId: string;
}

export interface GenerateVoiceResponseOptions {
    userSpeech: string;
    agentName: string;
    agentRole: string;
    companyName?: string;
    leadName?: string;
    callHistory: { role: string; content: string }[];
}

// ─── Initiate an outbound call ────────────────────────────────────────────────

export async function makeOutboundCall(options: MakeCallOptions): Promise<string> {
    const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

    const call = await twilioClient.calls.create({
        to: options.to,
        from: process.env.TWILIO_PHONE_NUMBER!,
        url: `${webhookBase}/api/twilio/voice?agentId=${options.agentId}&leadId=${options.leadId ?? ''}&orgId=${options.organizationId}`,
        statusCallback: `${webhookBase}/api/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingStatusCallback: `${webhookBase}/api/twilio/recording`,
    });

    return call.sid;
}

// ─── Generate TwiML for initial greeting ─────────────────────────────────────

export function generateGreetingTwiML(
    agentName: string,
    leadName?: string,
    webhookBase?: string
): string {
    const base = webhookBase ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';
    const greeting = leadName
        ? `Hi ${leadName}, I'm ${agentName}, an AI sales assistant. I'm calling to learn about your business needs. Is now a good time to chat for a couple of minutes?`
        : `Hi there, I'm ${agentName}, an AI sales assistant. I'm calling to learn about your business needs. Is now a good time to chat?`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">${greeting}</Say>
  <Gather input="speech" action="${base}/api/twilio/gather" method="POST"
          speechTimeout="3" timeout="10" language="en-US">
    <Say voice="Polly.Joanna">Please go ahead.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. I'll try again later. Goodbye!</Say>
  <Hangup/>
</Response>`;
}

// ─── Generate TwiML response from AI ─────────────────────────────────────────

export async function generateAIVoiceResponse(
    opts: GenerateVoiceResponseOptions
): Promise<{ twiml: string; shouldHangup: boolean; aiText: string }> {
    const systemPrompt = `You are ${opts.agentName}, ${opts.agentRole} at ${opts.companyName ?? 'our company'}.
You are on a PHONE CALL with ${opts.leadName ?? 'a prospect'}.

RULES:
- Keep responses SHORT — max 2-3 sentences for voice
- Be conversational and natural
- Use BANT qualification: ask about Budget, Authority, Need, Timeline
- One question at a time
- If they want to end the call, say goodbye professionally
- If they're interested, try to book a meeting

Detect intent:
- If user says "goodbye", "not interested", "stop", "bye" → end with HANGUP
- Otherwise continue the conversation`;

    const messages = [
        ...opts.callHistory.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        { role: 'user' as const, content: opts.userSpeech },
    ];

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 150,
        temperature: 0.7,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
    });
    const aiText = completion.choices[0].message.content ?? "I'm sorry, could you repeat that?";

    // Detect if we should hang up
    const endPhrases = ['goodbye', 'not interested', 'take me off', 'stop calling', 'bye'];
    const shouldHangup = endPhrases.some((p) =>
        opts.userSpeech.toLowerCase().includes(p) ||
        aiText.toLowerCase().includes('goodbye') ||
        aiText.toLowerCase().includes('have a great day')
    );

    const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

    const twiml = shouldHangup
        ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiText}</Say>
  <Hangup/>
</Response>`
        : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiText}</Say>
  <Gather input="speech" action="${webhookBase}/api/twilio/gather" method="POST"
          speechTimeout="3" timeout="10" language="en-US">
  </Gather>
  <Say voice="Polly.Joanna">Are you still there?</Say>
  <Hangup/>
</Response>`;

    return { twiml, shouldHangup, aiText };
}

// ─── Format phone number to E.164 ────────────────────────────────────────────

export function formatPhoneE164(phone: string, defaultCountry = 'IN'): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Indian number
    if (defaultCountry === 'IN') {
        if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
        if (digits.length === 10) return `+91${digits}`;
    }

    // Already has country code
    if (digits.length > 10) return `+${digits}`;

    return `+${digits}`;
}