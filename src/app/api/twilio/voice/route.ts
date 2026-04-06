import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateGreetingTwiML } from '@/lib/twilio';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid  = formData.get('CallSid') as string;
    const from     = formData.get('From')    as string;
    const to       = formData.get('To')      as string;

    console.log(`[Voice] ${from} → ${to} | SID: ${callSid}`);

    const agent = await prisma.agent.findFirst({
      where:   { isActive: true, isDefault: true },
      include: { organization: true },
    });

    if (!agent) {
      return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Thank you for calling. We will get back to you shortly. Goodbye!</Say>
  <Hangup/>
</Response>`);
    }

    const org      = agent.organization as any;
    const agentAny = agent as any;

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: { organizationId: agent.organizationId, phone: from },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          organizationId: agent.organizationId,
          email:          `caller_${from.replace(/[^0-9]/g, '')}@voice.local`,
          phone:          from,
          source:         'inbound_call',
          status:         'NEW',
        },
      });
    }

    // Create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { twilioCallSid: callSid },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: agent.organizationId,
          agentId:        agent.id,
          leadId:         lead.id,
          channel:        'VOICE',
          status:         'ACTIVE',
          twilioCallSid:  callSid,
          startedAt:      new Date(),
          sessionId:      callSid,
        },
      });
    }

    await prisma.activity.create({
      data: {
        leadId:      lead.id,
        type:        'call_started',
        title:       'Voice call started',
        description: `Call from ${from}`,
        actorType:   'agent',
        actorId:     agent.id,
        metadata:    { callSid, from, to },
      },
    }).catch(() => null);

    const hospitalName     = agentAny.companyName ?? org?.name ?? 'City Hospital';
    const preferredLang    = lead.preferredLanguage ?? 'EN';
    const base             = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

    const twiml = generateGreetingTwiML(
      agent.name,
      lead.firstName ?? undefined,
      base,
      preferredLang,
    );

    return xml(twiml);

  } catch (error) {
    console.error('[Voice] Error:', error);
    return xml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Thank you for calling. Please try again shortly. Goodbye!</Say>
  <Hangup/>
</Response>`);
  }
}

function xml(c: string) {
  return new NextResponse(c, { headers: { 'Content-Type': 'text/xml' } });
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