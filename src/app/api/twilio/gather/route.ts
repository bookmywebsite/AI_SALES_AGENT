import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAIVoiceResponse } from '@/lib/twilio';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData      = await request.formData();
    const callSid       = formData.get('CallSid')       as string;
    const speechResult  = (formData.get('SpeechResult') as string) ?? '';

    console.log(`[Gather] CallSid: ${callSid} | Speech: "${speechResult}"`);

    const conversation = await prisma.conversation.findFirst({
      where:   { twilioCallSid: callSid },
      include: {
        agent:    true,
        lead:     true,
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    });

    if (!conversation) {
      return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">I am sorry, I lost our conversation. Please call us back. Goodbye!</Say>
  <Hangup/>
</Response>`);
    }

    // Save patient speech
    if (speechResult) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role:           'user',
          content:        speechResult,
          senderType:     'lead',
        },
      });
    }

    const agent    = conversation.agent as any;
    const lead     = conversation.lead;
    const history  = conversation.messages.map(m => ({ role: m.role, content: m.content }));

    const { twiml, shouldHangup, aiText } = await generateAIVoiceResponse({
      userSpeech:         speechResult || 'Hello',
      agentName:          agent.name ?? 'PrimePro',
      agentRole:          agent.role ?? 'Hospital AI Assistant',
      companyName:        agent.companyName ?? (agent as any).organization?.name ?? 'City Hospital',
      leadName:           lead?.firstName ?? undefined,
      callHistory:        history,
      preferredLanguage:  lead?.preferredLanguage ?? 'EN',
    });

    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role:           'assistant',
        content:        aiText,
        senderType:     'agent',
      },
    });

    // Log activity
    if (lead?.id && speechResult) {
      await prisma.activity.create({
        data: {
          leadId:      lead.id,
          type:        'hospital_voice',
          title:       'Hospital AI Voice Response',
          description: `Patient: "${speechResult.slice(0, 200)}"`,
          actorType:   'agent',
          actorId:     conversation.agentId,
          metadata:    { aiResponse: aiText.slice(0, 300), callSid },
        },
      }).catch(() => null);
    }

    if (shouldHangup) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data:  { status: 'CLOSED', endedAt: new Date() },
      }).catch(() => null);
    }

    return xml(twiml);

  } catch (error) {
    console.error('[Gather] Fatal:', error);
    return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">I am sorry for the trouble. Our team will call you back. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
}

function xml(c: string) {
  return new NextResponse(c, { headers: { 'Content-Type': 'text/xml' } });
}

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getVoiceConfig, detectLanguageFromText } from '@/lib/voice/language-config';
// import Groq from 'groq-sdk';

// // Use fastest Groq model for voice — 3x faster than 70b
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// const VOICE_MODEL = 'llama-3.1-8b-instant'; // fastest for real-time voice

// function escapeXml(t: string): string {
//   return t
//     .replace(/&/g,  '&amp;')
//     .replace(/</g,  '&lt;')
//     .replace(/>/g,  '&gt;')
//     .replace(/"/g,  '&quot;')
//     .replace(/'/g,  '&apos;');
// }

// export async function POST(request: NextRequest) {
//   try {
//     const cloned        = request.clone();
//     const formData      = await cloned.formData();
//     const callSid       = formData.get('CallSid')      as string ?? '';
//     const speechResult  = formData.get('SpeechResult') as string ?? '';

//     const { searchParams } = new URL(request.url);
//     let language          = searchParams.get('language')       ?? 'EN';
//     const conversationId  = searchParams.get('conversationId') ?? '';

//     console.log(`[Gather] "${speechResult.slice(0, 60)}" | Lang: ${language}`);

//     // Auto-detect language
//     if (speechResult) {
//       const detected = detectLanguageFromText(speechResult);
//       if (detected !== 'EN') language = detected;
//     }

//     const voiceConfig = getVoiceConfig(language);

//     // Find conversation — limit history to last 6 messages only for speed
//     let conversation;
//     if (conversationId) {
//       conversation = await prisma.conversation.findUnique({
//         where:   { id: conversationId },
//         include: {
//           agent:    true,
//           lead:     true,
//           messages: { orderBy: { createdAt: 'desc' }, take: 6 }, // last 6 only
//         },
//       });
//       // Reverse to chronological order
//       if (conversation?.messages) {
//         conversation.messages = conversation.messages.reverse();
//       }
//     } else {
//       conversation = await prisma.conversation.findFirst({
//         where:   { twilioCallSid: callSid },
//         include: {
//           agent:    true,
//           lead:     true,
//           messages: { orderBy: { createdAt: 'desc' }, take: 6 },
//         },
//       });
//       if (conversation?.messages) {
//         conversation.messages = conversation.messages.reverse();
//       }
//     }

//     if (!conversation) {
//       const fallback = `<?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">Sorry, I lost context. Goodbye!</Say>
//   <Hangup/>
// </Response>`;
//       return new NextResponse(fallback, { headers: { 'Content-Type': 'text/xml' } });
//     }

//     // Save user message — fire and forget for speed
//     const savePromise = speechResult ? prisma.message.create({
//       data: {
//         conversationId: conversation.id,
//         role:           'user',
//         content:        speechResult,
//         senderType:     'lead',
//       },
//     }) : Promise.resolve(null);

//     // ── Build COMPACT system prompt for speed ─────────────────────────────
//     const systemPrompt = `You are ${conversation.agent.name}, AI Sales Rep at fuelo technologies calling ${conversation.lead?.firstName ?? 'a prospect'}.

// VOICE RULES (CRITICAL):
// - Max 1-2 SHORT sentences — you are on a phone call
// - One question per response
// - BANT qualify: Budget, Authority, Need, Timeline
// - Natural conversational tone
// - If they say goodbye/not interested → end politely

// ${language !== 'EN' ? `Respond in ${voiceConfig.name} language.` : ''}`;

//     // Build minimal message history
//     const messages = [
//       ...conversation.messages.map((m) => ({
//         role:    m.role as 'user' | 'assistant',
//         content: m.content,
//       })),
//       { role: 'user' as const, content: speechResult || 'Hello' },
//     ];

//     // ── Call Groq with speed-optimized settings ───────────────────────────
//     const completion = await groq.chat.completions.create({
//       model:       VOICE_MODEL,
//       max_tokens:  80,          // very short — voice responses should be brief
//       temperature: 0.6,         // slightly lower = more predictable = faster
//       messages:    [
//         { role: 'system', content: systemPrompt },
//         ...messages,
//       ],
//     });

//     const aiText = completion.choices[0].message.content?.trim()
//       ?? "Could you tell me more about that?";

//     // Save AI response — fire and forget
//     const saveAiPromise = prisma.message.create({
//       data: {
//         conversationId: conversation.id,
//         role:           'assistant',
//         content:        aiText,
//         senderType:     'agent',
//       },
//     });

//     // Update conversation stats — fire and forget
//     const updatePromise = prisma.conversation.update({
//       where: { id: conversation.id },
//       data:  { lastMessageAt: new Date(), messageCount: { increment: 2 } },
//     });

//     // Don't await DB writes — return TwiML immediately for speed
//     // DB writes happen in background
//     Promise.all([savePromise, saveAiPromise, updatePromise]).catch((err) =>
//       console.error('[Gather] DB write error:', err)
//     );

//     // Detect hangup intent
//     const endPhrases = [
//       'goodbye', 'bye', 'not interested', 'stop calling', 'remove',
//       'अलविदा', 'बाय', 'நன்றி', 'సరే బై', 'ಧನ್ಯವಾದ',
//     ];
//     const shouldHangup =
//       endPhrases.some((p) => speechResult.toLowerCase().includes(p)) ||
//       aiText.toLowerCase().includes('goodbye') ||
//       aiText.toLowerCase().includes('have a great day') ||
//       aiText.toLowerCase().includes('take care');

//     if (shouldHangup) {
//       prisma.conversation.update({
//         where: { id: conversation.id },
//         data:  { status: 'CLOSED', endedAt: new Date() },
//       }).catch(() => {});

//       return new NextResponse(
//         `<?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">${escapeXml(aiText)}</Say>
//   <Hangup/>
// </Response>`,
//         { headers: { 'Content-Type': 'text/xml' } }
//       );
//     }

//     const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

//     return new NextResponse(
//       `<?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">${escapeXml(aiText)}</Say>
//   <Gather
//     input="speech"
//     action="${BASE_URL}/api/twilio/gather?language=${language}&amp;conversationId=${conversation.id}"
//     method="POST"
//     speechTimeout="1"
//     timeout="8"
//     language="${voiceConfig.sttLanguage}"
//   >
//   </Gather>
//   <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">Are you still there?</Say>
//   <Hangup/>
// </Response>`,
//       { headers: { 'Content-Type': 'text/xml' } }
//     );

//   } catch (error) {
//     console.error('[Twilio Gather]', error);
//     return new NextResponse(
//       `<Response><Say>I am having trouble. Let me call you back. Goodbye!</Say><Hangup/></Response>`,
//       { headers: { 'Content-Type': 'text/xml' } }
//     );
//   }
// }