import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildHospitalGreeting } from '@/lib/agents/hospital-brain';

export const dynamic = 'force-dynamic';

// POST /api/twilio/voice — Twilio calls this when a call comes in
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    console.log(`[Voice] Inbound: ${from} → ${to} | CallSid: ${callSid}`);

    // ── Find agent by Twilio phone number ────────────────────────────────────
    const agent = await prisma.agent.findFirst({
      where: { isActive: true, isDefault: true },
      include: { organization: true },
    });

    if (!agent) {
      return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. We will get back to you shortly. Goodbye!</Say>
  <Hangup/>
</Response>`);
    }

    const org = agent.organization as any;

    // ── Find or create lead from caller number ────────────────────────────────
    let lead = await prisma.lead.findFirst({
      where: { organizationId: agent.organizationId, phone: from },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId: agent.organizationId,
          email: `caller_${from.replace('+', '').replace(/\s/g, '')}@phonecall.local`,
          phone: from,
          source: 'inbound_call',
          status: 'NEW',
        },
      });
    }

    // ── Create conversation ───────────────────────────────────────────────────
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: agent.organizationId,
        agentId: agent.id,
        leadId: lead.id,
        channel: 'VOICE',
        status: 'ACTIVE',
        twilioCallSid: callSid,
        startedAt: new Date(),
        sessionId: callSid,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: 'call_started',
        title: 'Inbound call started',
        description: `Call from ${from}`,
        actorType: 'agent',
        actorId: agent.id,
        metadata: { callSid, from, to },
      },
    }).catch(() => null);

    // ── Check if hospital mode ────────────────────────────────────────────────
    const agentAny = agent as any;
    const isHospital = agentAny.agentType === 'HOSPITAL'
      || agentAny.role?.toLowerCase().includes('hospital')
      || agentAny.role?.toLowerCase().includes('medical')
      || agentAny.companyName?.toLowerCase().includes('hospital')
      || agentAny.companyName?.toLowerCase().includes('clinic')
      || agentAny.companyName?.toLowerCase().includes('health')
      || org?.name?.toLowerCase().includes('hospital')
      || org?.name?.toLowerCase().includes('clinic');

    let twiml: string;

    if (isHospital) {
      twiml = buildHospitalGreeting(
        agent.name,
        agentAny.companyName ?? org?.name ?? 'the hospital',
        lead.firstName ?? undefined,
      );
    } else {
      // Standard sales greeting
      const companyName = agentAny.companyName ?? org?.name ?? 'our company';
      const leadName = lead.firstName ? `, ${lead.firstName}` : '';
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Hello${leadName}! This is ${agent.name} from ${companyName}. How can I help you today?</Say>
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
  <Hangup/>
</Response>`;
    }

    return xmlResponse(twiml);

  } catch (error) {
    console.error('[Voice] Error:', error);
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Please try again shortly. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}



// import { type NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { generateGreetingTwiML } from '@/lib/twilio';

// export async function POST(request: NextRequest) {
//   try {
//     // Next.js 15 fix — clone request before reading formData
//     const cloned  = request.clone();
//     const formData = await cloned.formData();

//     const callSid = formData.get('CallSid') as string ?? '';
//     const from    = formData.get('From')    as string ?? '';
//     const to      = formData.get('To')      as string ?? '';

//     const { searchParams } = new URL(request.url);
//     const agentId = searchParams.get('agentId')  ?? '';
//     const leadId  = searchParams.get('leadId')   ?? '';
//     const orgId   = searchParams.get('orgId')    ?? '';

//     // Fetch agent
//     const agent = agentId
//       ? await prisma.agent.findUnique({ where: { id: agentId } })
//       : null;

//     // Find lead
//     let lead = null;
//     if (leadId) {
//       lead = await prisma.lead.findUnique({ where: { id: leadId } });
//     } else if (from && orgId) {
//       lead = await prisma.lead.findFirst({
//         where: { organizationId: orgId, phone: from },
//       });
//     }

//     const organizationId = orgId || agent?.organizationId || '';

//     // Create conversation record only if we have an org
//     if (organizationId && agentId && callSid) {
//       await prisma.conversation.create({
//         data: {
//           organizationId,
//           agentId,
//           leadId:        lead?.id       ?? null,
//           channel:       'VOICE',
//           status:        'ACTIVE',
//           sessionId:     callSid,
//           twilioCallSid: callSid,
//           phoneFrom:     from,
//           phoneTo:       to,
//           startedAt:     new Date(),
//         },
//       });
//     }

//     // Generate TwiML greeting
//     const twiml = generateGreetingTwiML(
//       agent?.name ?? 'PrimePro',
//       lead?.firstName ?? undefined,
//       process.env.NEXT_PUBLIC_APP_URL
//     );

//     return new NextResponse(twiml, {
//       status:  200,
//       headers: { 'Content-Type': 'text/xml; charset=utf-8' },
//     });

//   } catch (error) {
//     console.error('[Twilio Voice] Error:', error);
//     const fallback = `<?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="Polly.Joanna">Sorry, we are experiencing technical difficulties. Please try again later.</Say>
//   <Hangup/>
// </Response>`;
//     return new NextResponse(fallback, {
//       status:  200,
//       headers: { 'Content-Type': 'text/xml; charset=utf-8' },
//     });
//   }
// }

// // Twilio sends GET for validation sometimes
// export async function GET() {
//   const twiml = `<?xml version="1.0" encoding="UTF-8"?>
// <Response><Say>Hello from Fuelo Technologies</Say></Response>`;
//   return new NextResponse(twiml, {
//     status:  200,
//     headers: { 'Content-Type': 'text/xml; charset=utf-8' },
//   });
// }