import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAgentMessage } from '@/lib/agents/brain';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

// ── Init clients ──────────────────────────────────────────────────────────────
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// ── Send appointment confirmation email ───────────────────────────────────────
async function sendAppointmentEmail(params: {
  patientEmail: string;
  patientName: string;
  hospitalName: string;
  department: string;
  date: string;
  time: string;
  agentName: string;
}) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log('[Email] SendGrid not configured — skipping email');
    return false;
  }

  try {
    await sgMail.send({
      to: params.patientEmail,
      from: { email: process.env.SENDGRID_FROM_EMAIL, name: params.hospitalName },
      subject: `Appointment Confirmation — ${params.hospitalName}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">🏥 Appointment Confirmed</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">${params.hospitalName}</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="color: #333; font-size: 15px; margin: 0 0 20px;">Dear <strong>${params.patientName}</strong>,</p>
      <p style="color: #555; font-size: 14px; margin: 0 0 24px;">Your appointment has been successfully booked. Here are your appointment details:</p>

      <!-- Details card -->
      <div style="background: #f0f0ff; border-left: 4px solid #6366f1; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #888; font-size: 13px; padding: 5px 0; width: 120px;">Department</td>
            <td style="color: #333; font-size: 14px; font-weight: 600; padding: 5px 0;">${params.department}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 5px 0;">Date</td>
            <td style="color: #333; font-size: 14px; font-weight: 600; padding: 5px 0;">${params.date || 'To be confirmed'}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 5px 0;">Time</td>
            <td style="color: #333; font-size: 14px; font-weight: 600; padding: 5px 0;">${params.time || 'To be confirmed'}</td>
          </tr>
          <tr>
            <td style="color: #888; font-size: 13px; padding: 5px 0;">Patient</td>
            <td style="color: #333; font-size: 14px; font-weight: 600; padding: 5px 0;">${params.patientName}</td>
          </tr>
        </table>
      </div>

      <p style="color: #555; font-size: 14px; margin: 0 0 8px;">📋 <strong>What to bring:</strong></p>
      <ul style="color: #555; font-size: 14px; margin: 0 0 24px; padding-left: 20px;">
        <li>Valid photo ID / Aadhar card</li>
        <li>Previous medical records (if any)</li>
        <li>Insurance card (if applicable)</li>
        <li>List of current medicines</li>
      </ul>

      <p style="color: #555; font-size: 13px; margin: 0 0 6px;">⏰ Please arrive 15 minutes before your appointment time.</p>
      <p style="color: #555; font-size: 13px; margin: 0 0 24px;">📞 For any changes or queries, please call the hospital reception.</p>

      <p style="color: #333; font-size: 14px; margin: 0;">Warm regards,<br>
      <strong>${params.agentName}</strong><br>
      <span style="color: #888;">AI Health Assistant, ${params.hospitalName}</span></p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f8f8; padding: 16px 32px; border-top: 1px solid #eee;">
      <p style="color: #aaa; font-size: 12px; margin: 0; text-align: center;">This is an automated confirmation from ${params.hospitalName}'s AI assistant.</p>
    </div>
  </div>
</body>
</html>
      `,
    });
    console.log(`[Email] Appointment confirmation sent to ${params.patientEmail}`);
    return true;
  } catch (err: any) {
    console.error('[Email] Failed to send appointment email:', err?.message ?? err);
    return false;
  }
}

// ── Send appointment confirmation SMS ─────────────────────────────────────────
async function sendAppointmentSMS(params: {
  phone: string;
  patientName: string;
  hospitalName: string;
  department: string;
  date: string;
  time: string;
}) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('[SMS] Twilio not configured — skipping SMS');
    return false;
  }

  try {
    const msg = `Hi ${params.patientName}! Your appointment at ${params.hospitalName} is confirmed.\nDepartment: ${params.department}\nDate: ${params.date || 'TBD'}\nTime: ${params.time || 'TBD'}\nPlease arrive 15 mins early. Reply STOP to unsubscribe.`;

    await twilioClient.messages.create({
      body: msg,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: params.phone,
    });
    console.log(`[SMS] Appointment confirmation sent to ${params.phone}`);
    return true;
  } catch (err: any) {
    console.error('[SMS] Failed to send appointment SMS:', err?.message ?? err);
    return false;
  }
}

// ── Extract appointment details from conversation ─────────────────────────────
function extractAppointmentDetails(messages: { role: string; content: string }[]): {
  department: string; date: string; time: string; patientName: string;
} {
  const fullText = messages.map(m => m.content).join(' ').toLowerCase();

  // Extract department
  let department = 'General Physician';
  const depts = [
    { key: 'cardio', val: 'Cardiology' }, { key: 'derma', val: 'Dermatology' },
    { key: 'ortho', val: 'Orthopaedics' }, { key: 'paediat', val: 'Paediatrics' },
    { key: 'ophthal', val: 'Ophthalmology' }, { key: 'ent', val: 'ENT' },
    { key: 'gastro', val: 'Gastroenterology' }, { key: 'neuro', val: 'Neurology' },
    { key: 'gynae', val: 'Gynaecology' }, { key: 'gynecol', val: 'Gynaecology' },
    { key: 'pulmo', val: 'Pulmonology' }, { key: 'general physician', val: 'General Physician' },
    { key: 'psychiatr', val: 'Psychiatry' }, { key: 'nephrolo', val: 'Nephrology' },
    { key: 'cold', val: 'General Physician' }, { key: 'cough', val: 'General Physician' },
    { key: 'fever', val: 'General Physician' }, { key: 'pain', val: 'General Physician' },
  ];
  for (const d of depts) {
    if (fullText.includes(d.key)) { department = d.val; break; }
  }

  // Extract date
  let date = '';
  const datePatterns = [
    /\b(tomorrow)\b/,
    /\b(today)\b/,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)\b/i,
  ];
  for (const p of datePatterns) {
    const m = fullText.match(p);
    if (m) { date = m[1]; break; }
  }

  // Extract time
  let time = '';
  const timeMatch = fullText.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (timeMatch) time = timeMatch[1];

  // Extract patient name from messages
  let patientName = '';
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.content.toLowerCase().includes('hello')) {
      const nameMatch = msg.content.match(/hello\s+([A-Z][a-z]+)/i);
      if (nameMatch) { patientName = nameMatch[1]; break; }
    }
  }

  return { department, date, time, patientName };
}

// ── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, sessionId, email, firstName, lastName, phone } = body;

    if (!agentId || !message) {
      return NextResponse.json({ success: false, error: 'agentId and message are required' }, { status: 400 });
    }

    // Fetch agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { organization: true },
    });

    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    if (!agent.isActive) return NextResponse.json({ success: false, error: 'Agent is not active' }, { status: 400 });

    const agentAny = agent as any;
    const hospitalName = agentAny.companyName ?? (agent.organization as any)?.name ?? process.env.HOSPITAL_NAME ?? 'City Hospital';

    // Find or create conversation
    let conversation = sessionId
      ? await prisma.conversation.findUnique({
        where: { sessionId },
        include: { lead: true, messages: { orderBy: { id: 'asc' } } },
      })
      : null;

    if (!conversation) {
      // Find or create lead
      let lead = null;
      if (email) {
        lead = await prisma.lead.findFirst({
          where: { organizationId: agent.organizationId, email },
        });
        if (!lead) {
          lead = await prisma.lead.create({
            data: {
              organizationId: agent.organizationId,
              email,
              firstName: firstName ?? null,
              lastName: lastName ?? null,
              phone: phone ?? null,
              source: 'chat',
              status: 'NEW',
            },
          });
        } else if (phone && !lead.phone) {
          // Update phone if we now have it
          await prisma.lead.update({ where: { id: lead.id }, data: { phone } });
        }
      }

      const newSession = sessionId ?? `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      conversation = await prisma.conversation.create({
        data: {
          organizationId: agent.organizationId,
          agentId: agent.id,
          leadId: lead?.id ?? null,
          channel: 'CHAT',
          status: 'ACTIVE',
          sessionId: newSession,
          startedAt: new Date(),
        },
        include: { lead: true, messages: { orderBy: { id: 'asc' } } },
      });

      if (lead) {
        await prisma.lead.update({ where: { id: lead.id }, data: { status: 'CONTACTED' } });
      }
    }

    // Save user message
    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    // Call hospital brain
    const agentResponse = await processAgentMessage(message, {
      agent,
      lead: conversation.lead,
      conversationHistory: conversation.messages,
      channel: 'chat',
      sessionId: conversation.sessionId ?? undefined,
    });

    // Save AI response
    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'assistant', content: agentResponse.message },
    });

    // Update lead if needed
    if (agentResponse.leadUpdates && Object.keys(agentResponse.leadUpdates).length > 0 && conversation.lead) {
      await prisma.lead.update({
        where: { id: conversation.lead.id },
        data: agentResponse.leadUpdates as any,
      });
    }

    // ── APPOINTMENT BOOKING: Actually send email + SMS ─────────────────────
    const aiMsg = agentResponse.message.toLowerCase();
    const isAppointmentConfirmed =
      agentResponse.shouldBookMeeting ||
      (aiMsg.includes('appointment') && (
        aiMsg.includes('booked') || aiMsg.includes('confirmed') ||
        aiMsg.includes('noted') || aiMsg.includes('scheduled')
      ));

    if (isAppointmentConfirmed && conversation.lead) {
      const lead = conversation.lead;
      const allMessages = [...conversation.messages, { role: 'user', content: message }, { role: 'assistant', content: agentResponse.message }];
      const apptDetails = extractAppointmentDetails(allMessages);
      const patientName = lead.firstName ?? apptDetails.patientName ?? 'Patient';
      const patientEmail = lead.email;
      const patientPhone = lead.phone ?? phone ?? null;

      // Save meeting to DB
      try {
        await (prisma as any).meeting.create({
          data: {
            organizationId: agent.organizationId,
            leadId: lead.id,
            agentId: agent.id,
            title: `${apptDetails.department} Appointment — ${patientName}`,
            notes: `Booked via AI chat. Date: ${apptDetails.date || 'TBD'}, Time: ${apptDetails.time || 'TBD'}`,
            status: 'SCHEDULED',
            scheduledAt: new Date(),
          },
        });
      } catch (e) {
        console.error('[Meeting] DB save failed:', e);
      }

      // Log activity
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: 'appointment_booked',
          title: `Appointment booked — ${apptDetails.department}`,
          description: `Patient: ${patientName} | Date: ${apptDetails.date || 'TBD'} | Time: ${apptDetails.time || 'TBD'}`,
          actorType: 'agent',
          actorId: agent.id,
          metadata: { ...apptDetails, patientEmail, patientPhone, hospitalName },
        },
      }).catch(() => null);

      // Send email confirmation
      let emailSent = false;
      if (patientEmail && !patientEmail.includes('@voice.local') && !patientEmail.includes('@phonecall.local')) {
        emailSent = await sendAppointmentEmail({
          patientEmail,
          patientName,
          hospitalName,
          department: apptDetails.department,
          date: apptDetails.date,
          time: apptDetails.time,
          agentName: agent.name,
        });
      }

      // Send SMS confirmation
      let smsSent = false;
      if (patientPhone) {
        smsSent = await sendAppointmentSMS({
          phone: patientPhone,
          patientName,
          hospitalName,
          department: apptDetails.department,
          date: apptDetails.date,
          time: apptDetails.time,
        });
      }

      // Tell AI to mention confirmation status in a follow-up note
      const confirmNote = emailSent || smsSent
        ? `\n\n✅ Confirmation sent${emailSent ? ` to ${patientEmail}` : ''}${smsSent ? ` and SMS to ${patientPhone}` : ''}.`
        : patientEmail
          ? `\n\n⚠️ Note: We were unable to send the confirmation email right now. Please note your appointment details: ${apptDetails.department}${apptDetails.date ? ` on ${apptDetails.date}` : ''}${apptDetails.time ? ` at ${apptDetails.time}` : ''}.`
          : '';

      if (confirmNote) {
        // Append to the saved AI message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: confirmNote,
          },
        });
        agentResponse.message += confirmNote;
      }
    }

    // Increment org conversation count
    await prisma.organization.update({
      where: { id: agent.organizationId },
      data: { conversationCount: { increment: 1 } },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: agentResponse.message,
      quickActions: agentResponse.quickActions ?? [],
      sessionId: conversation.sessionId,
      leadUpdated: false,
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong. Please try again.',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}


// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { processAgentMessage } from '@/lib/agents/brain';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { agentId, message, sessionId, email, firstName, lastName } = body;

//     // Validate required fields
//     if (!agentId || !message) {
//       return NextResponse.json(
//         { success: false, error: 'agentId and message are required' },
//         { status: 400 }
//       );
//     }

//     if (!process.env.OPENAI_API_KEY) {
//       return NextResponse.json(
//         { success: false, error: 'OpenAI API key not configured' },
//         { status: 500 }
//       );
//     }

//     // Fetch the agent
//     const agent = await prisma.agent.findUnique({
//       where: { id: agentId },
//       include: { organization: true },
//     });

//     if (!agent) {
//       return NextResponse.json(
//         { success: false, error: 'Agent not found' },
//         { status: 404 }
//       );
//     }

//     if (!agent.isActive) {
//       return NextResponse.json(
//         { success: false, error: 'Agent is not active' },
//         { status: 400 }
//       );
//     }

//     // Find or create conversation
//     let conversation = sessionId
//       ? await prisma.conversation.findUnique({
//           where: { sessionId },
//           include: {
//             lead: true,
//             messages: { orderBy: { id: 'asc' } },
//           },
//         })
//       : null;

//     if (!conversation) {
//       // Find or create lead
//       let lead = null;

//       if (email) {
//         lead = await prisma.lead.findFirst({
//           where: { organizationId: agent.organizationId, email },
//         });

//         if (!lead) {
//           lead = await prisma.lead.create({
//             data: {
//               organizationId: agent.organizationId,
//               email,
//               firstName: firstName ?? null,
//               lastName:  lastName  ?? null,
//               source:    'chat',
//               status:    'NEW',
//             },
//           });
//         }
//       }

//       // Create new conversation
//       conversation = await prisma.conversation.create({
//         data: {
//           organizationId: agent.organizationId,
//           agentId:        agent.id,
//           leadId:         lead?.id ?? null,
//           sessionId:      sessionId ?? `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
//           channel:        'CHAT',
//           status:         'ACTIVE',
//         },
//         include: {
//           lead:     true,
//           messages: true,
//         },
//       });

//       // Update lead status to CONTACTED if exists
//       if (lead) {
//         await prisma.lead.update({
//           where: { id: lead.id },
//           data:  { status: 'CONTACTED' },
//         });
//       }
//     }

//     // Save the user's message
//     await prisma.message.create({
//       data: {
//         conversationId: conversation.id,
//         role:           'user',
//         content:        message,
//       },
//     });

//     // Call OpenAI via the brain
//     const agentResponse = await processAgentMessage(message, {
//       agent,
//       lead:                conversation.lead,
//       conversationHistory: conversation.messages,
//       channel:             'chat',
//       sessionId:           conversation.sessionId ?? undefined,
//     });

//     // Save the assistant's response
//     await prisma.message.create({
//       data: {
//         conversationId: conversation.id,
//         role:           'assistant',
//         content:        agentResponse.message,
//       },
//     });

//     // Update lead data if agent qualified them
//     if (
//       agentResponse.leadUpdates &&
//       Object.keys(agentResponse.leadUpdates).length > 0 &&
//       conversation.lead
//     ) {
//       await prisma.lead.update({
//         where: { id: conversation.lead.id },
//         data:  agentResponse.leadUpdates,
//       });
//     }

//     // Increment conversation count on the organization
//     await prisma.organization.update({
//       where: { id: agent.organizationId },
//       data:  { conversationCount: { increment: 1 } },
//     });

//     return NextResponse.json({
//       success:      true,
//       message:      agentResponse.message,
//       quickActions: agentResponse.quickActions ?? [],
//       sessionId:    conversation.sessionId,
//       leadUpdated:  agentResponse.shouldQualify,
//     });

//   } catch (error) {
//     console.error('[Chat API] Error:', error);

//     // Return a friendly error message to the user
//     return NextResponse.json(
//       {
//         success: false,
//         error:   'Something went wrong. Please try again.',
//         message: "I'm having trouble connecting right now. Please try again in a moment.",
//       },
//       { status: 500 }
//     );
//   }
// }