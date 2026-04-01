import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoiceConfig, generateGreeting } from '@/lib/voice/language-config';

function escapeXml(t: string): string {
  return t
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId      = searchParams.get('leadId')      ?? '';
    const agentId     = searchParams.get('agentId')     ?? '';
    const callQueueId = searchParams.get('callQueueId') ?? '';
    const language    = searchParams.get('language')    ?? 'EN';

    const cloned     = request.clone();
    const formData   = await cloned.formData();
    const callSid    = formData.get('CallSid')    as string ?? '';
    const answeredBy = formData.get('AnsweredBy') as string ?? '';

    const [agent, lead] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agentId } }),
      prisma.lead.findUnique({ where: { id: leadId } }),
    ]);

    if (!agent || !lead) {
      return new NextResponse(
        `<Response><Say>Sorry, there was an error. Goodbye.</Say><Hangup/></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Get language voice config
    const voiceConfig = getVoiceConfig(language);

    // Answering machine — leave voicemail in correct language
    if (answeredBy?.startsWith('machine')) {
      const voicemailMessages: Record<string, string> = {
        EN: `Hi ${lead.firstName ?? 'there'}, this is ${agent.name} from u8u.ai. Please visit u8u.ai or call us back. Thank you!`,
        HI: `नमस्ते ${lead.firstName ?? ''}, मैं ${agent.name} u8u.ai से बोल रहा हूं। कृपया हमें वापस कॉल करें।`,
        TA: `வணக்கம் ${lead.firstName ?? ''}, நான் ${agent.name}, u8u.ai இலிருந்து. திரும்ப அழைக்கவும்.`,
        TE: `నమస్కారం ${lead.firstName ?? ''}, నేను ${agent.name}, u8u.ai నుండి. తిరిగి కాల్ చేయండి.`,
        KN: `ನಮಸ್ಕಾರ ${lead.firstName ?? ''}, ನಾನು ${agent.name}, u8u.ai ನಿಂದ. ತಿರಿಗಿ ಕರೆ ಮಾಡಿ.`,
        ML: `നമസ്കാരം ${lead.firstName ?? ''}, ഞാൻ ${agent.name}, u8u.ai-ൽ നിന്ന്. തിരിച്ചു വിളിക്കൂ.`,
        MR: `नमस्कार ${lead.firstName ?? ''}, मी ${agent.name}, u8u.ai वरून. कृपया परत कॉल करा.`,
        BN: `নমস্কার ${lead.firstName ?? ''}, আমি ${agent.name}, u8u.ai থেকে। আবার কল করুন।`,
        GU: `નમસ્તે ${lead.firstName ?? ''}, હું ${agent.name}, u8u.ai થી. ફરીથી કૉલ કરો.`,
        PA: `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${lead.firstName ?? ''}, ਮੈਂ ${agent.name}, u8u.ai ਤੋਂ। ਵਾਪਸ ਕਾਲ ਕਰੋ।`,
        OR: `ନମସ୍କାର ${lead.firstName ?? ''}, ମୁଁ ${agent.name}, u8u.ai ରୁ। ଆଉ ଥରେ ଫୋନ୍ କରନ୍ତୁ।`,
      };

      const voicemailText = voicemailMessages[language] ?? voicemailMessages.EN;

      await prisma.activity.create({
        data: {
          leadId,
          type:      'call_voicemail',
          title:     `Voicemail left [${language}]`,
          actorType: 'agent',
          actorId:   agentId,
          metadata:  { callSid, language },
        },
      }).catch(() => {});

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">
    ${escapeXml(voicemailText)}
  </Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Human answered — create conversation
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: agent.organizationId,
        agentId:        agent.id,
        leadId:         lead.id,
        channel:        'VOICE',
        status:         'ACTIVE',
        sessionId:      callSid,
        twilioCallSid:  callSid,
        startedAt:      new Date(),
      },
    });

    // Update queue activity
    if (callQueueId) {
      await prisma.activity.update({
        where: { id: callQueueId },
        data:  {
          description: `Status: IN_PROGRESS | Language: ${language}`,
          metadata:    { status: 'IN_PROGRESS', callSid, conversationId: conversation.id, language },
        },
      }).catch(() => {});
    }

    // Update lead
    await prisma.lead.update({
      where: { id: leadId },
      data:  {
        status:          lead.status === 'NEW' ? 'CONTACTED' : lead.status,
        lastContactedAt: new Date(),
      },
    }).catch(() => {});

    // Generate greeting in the correct language
    const greeting = generateGreeting(agent.name, lead.firstName, language);
    const BASE_URL  = process.env.NEXT_PUBLIC_APP_URL!;

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">
    ${escapeXml(greeting)}
  </Say>
  <Gather
    input="speech"
    action="${BASE_URL}/api/twilio/gather?language=${language}&amp;conversationId=${conversation.id}"
    method="POST"
    speechTimeout="3"
    timeout="10"
    language="${voiceConfig.sttLanguage}"
  >
    <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">
      Please go ahead.
    </Say>
  </Gather>
  <Say voice="${voiceConfig.twilioVoice}" language="${voiceConfig.twilioLanguage}">
    I did not hear anything. I will call you back. Goodbye!
  </Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error) {
    console.error('[Outbound Connect]', error);
    return new NextResponse(
      `<Response><Say>Technical error. Goodbye.</Say><Hangup/></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}