import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/twilio/status
// Twilio calls this when call status changes
export async function POST(request: NextRequest) {
  try {
    const formData    = await request.formData();
    const callSid     = formData.get('CallSid')      as string;
    const callStatus  = formData.get('CallStatus')   as string;
    const callDuration = formData.get('CallDuration') as string;

    console.log(`[Twilio Status] CallSid: ${callSid} | Status: ${callStatus} | Duration: ${callDuration}s`);

    const conversation = await prisma.conversation.findFirst({
      where: { twilioCallSid: callSid },
    });

    if (!conversation) return NextResponse.json({ success: true });

    if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'no-answer' || callStatus === 'busy') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data:  {
          status:       'CLOSED',
          endedAt:      new Date(),
          callDuration: callDuration ? parseInt(callDuration) : null,
        },
      });

      // Log activity on lead
      if (conversation.leadId) {
        await prisma.activity.create({
          data: {
            leadId:      conversation.leadId,
            type:        'call_completed',
            title:       `Call ${callStatus}`,
            description: callDuration ? `Duration: ${callDuration} seconds` : undefined,
            actorType:   'agent',
            actorId:     conversation.agentId,
            metadata:    { callSid, callStatus, callDuration },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Twilio Status] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}