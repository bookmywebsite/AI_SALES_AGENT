import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { makeOutboundCall, formatPhoneE164 } from '@/lib/twilio';

// POST /api/twilio/call
// Initiates an outbound call to a lead
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body    = await request.json();
    const { leadId, agentId } = body;

    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId },
    });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (!lead.phone) return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 });

    // Get agent (use default if not specified)
    let agent;
    if (agentId) {
      agent = await prisma.agent.findUnique({ where: { id: agentId } });
    } else {
      agent = await prisma.agent.findFirst({
        where: { organizationId: user.organizationId, isDefault: true, isActive: true },
      });
    }
    if (!agent) return NextResponse.json({ error: 'No active agent found' }, { status: 404 });

    const formattedPhone = formatPhoneE164(lead.phone);

    const callSid = await makeOutboundCall({
      to:             formattedPhone,
      agentId:        agent.id,
      leadId:         lead.id,
      organizationId: user.organizationId,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId:      lead.id,
        type:        'call_initiated',
        title:       `Outbound call initiated`,
        description: `Calling ${formattedPhone}`,
        actorType:   'user',
        actorId:     user.id,
        metadata:    { callSid },
      },
    });

    // Update lead
    await prisma.lead.update({
      where: { id: lead.id },
      data:  { lastContactedAt: new Date() },
    });

    return NextResponse.json({ success: true, callSid, phone: formattedPhone });
  } catch (error: any) {
    console.error('[Twilio Call] Error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to initiate call' },
      { status: 500 }
    );
  }
}