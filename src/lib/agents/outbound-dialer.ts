import Twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { getVoiceConfig, generateGreeting } from '@/lib/voice/language-config';

const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function makeOutboundCall(params: {
  leadId:      string;
  agentId:     string;
  phoneNumber: string;
  language:    string;
  callQueueId: string;
}): Promise<{ success: boolean; callSid: string; leadId: string }> {
  const { leadId, agentId, phoneNumber, language, callQueueId } = params;

  const formatted = formatPhone(phoneNumber);

  const call = await twilioClient.calls.create({
    to:   formatted,
    from: process.env.TWILIO_PHONE_NUMBER!,
    url:  `${BASE_URL}/api/voice/outbound/connect?` + new URLSearchParams({
      leadId, agentId, callQueueId, language,
    }),
    statusCallback: `${BASE_URL}/api/voice/outbound/status?` + new URLSearchParams({
      leadId, agentId, callQueueId,
    }),
    statusCallbackEvent:  ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST',
    machineDetection:     'DetectMessageEnd',
    machineDetectionTimeout: 5,
    timeout: 30,
    record:  true,
  });

  console.log(`Outbound call initiated: ${call.sid} to ${formatted} [${language}]`);

  // Log to Activity
  await prisma.activity.create({
    data: {
      leadId,
      type:        'call_initiated',
      title:       `Outbound call initiated [${language}]`,
      description: `Calling ${formatted} | CallSid: ${call.sid}`,
      actorType:   'agent',
      actorId:     agentId,
      metadata: {
        callSid:   call.sid,
        direction: 'OUTBOUND',
        status:    'RINGING',
        from:      process.env.TWILIO_PHONE_NUMBER,
        to:        formatted,
        language,
        callQueueId,
      },
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data:  { lastContactedAt: new Date() },
  }).catch(() => {});

  return { success: true, callSid: call.sid, leadId };
}

export function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

export async function cancelCall(callSid: string, leadId: string): Promise<void> {
  await twilioClient.calls(callSid).update({ status: 'canceled' });
  await prisma.activity.create({
    data: {
      leadId,
      type:      'call_cancelled',
      title:     'Call cancelled',
      actorType: 'system',
      metadata:  { callSid },
    },
  }).catch(() => {});
}