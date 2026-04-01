import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAgentMessage } from '@/lib/agents/brain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, sessionId, email, firstName, lastName } = body;

    // Validate required fields
    if (!agentId || !message) {
      return NextResponse.json(
        { success: false, error: 'agentId and message are required' },
        { status: 400 }
      );
    }

    // ── REMOVED OpenAI key check (we use Groq now) ────────────────────────────

    // Fetch the agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { organization: true },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, error: 'Agent is not active' },
        { status: 400 }
      );
    }

    // ── Find or create conversation ───────────────────────────────────────────
    let conversation = sessionId
      ? await prisma.conversation.findUnique({
          where: { sessionId },
          include: {
            lead:     true,
            messages: { orderBy: { createdAt: 'asc' } },
          },
        })
      : null;

    if (!conversation) {
      // ── Find or create lead ─────────────────────────────────────────────────
      let lead = null;

      if (email) {
        // Try to find existing lead by email
        lead = await prisma.lead.findFirst({
          where: { organizationId: agent.organizationId, email },
        });

        if (!lead) {
          lead = await prisma.lead.create({
            data: {
              organizationId: agent.organizationId,
              email,
              firstName:      firstName ?? null,
              lastName:       lastName  ?? null,
              source:         'chat',
              status:         'NEW',
            },
          });

          // Log activity for new lead
          await prisma.activity.create({
            data: {
              leadId:      lead.id,
              type:        'lead_created',
              title:       'Lead created via chat widget',
              description: `New lead from chat: ${email}`,
              actorType:   'agent',
              actorId:     agent.id,
            },
          });
        }
      } else {
        // ── No email yet — create an anonymous lead placeholder ───────────────
        // We create a temporary lead so conversations are always linked
        lead = await prisma.lead.create({
          data: {
            organizationId: agent.organizationId,
            email:          `anonymous_${Date.now()}@chat.u8u.ai`,
            firstName:      'Anonymous',
            source:         'chat',
            status:         'NEW',
          },
        });
      }

      // ── Create new conversation ─────────────────────────────────────────────
      const newSessionId = sessionId
        ?? `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      conversation = await prisma.conversation.create({
        data: {
          organizationId: agent.organizationId,
          agentId:        agent.id,
          leadId:         lead?.id ?? null,
          sessionId:      newSessionId,
          channel:        'CHAT',
          status:         'ACTIVE',
          startedAt:      new Date(),
        },
        include: {
          lead:     true,
          messages: true,
        },
      });

      // Update agent conversation count
      await prisma.agent.update({
        where: { id: agent.id },
        data:  { totalConversations: { increment: 1 } },
      });

      // Update lead status to CONTACTED
      if (lead) {
        await prisma.lead.update({
          where: { id: lead.id },
          data:  { status: 'CONTACTED', lastContactedAt: new Date() },
        });
      }
    } else {
      // ── Existing conversation — if email now provided, link to real lead ────
      if (email && conversation.lead?.email?.includes('@chat.u8u.ai')) {
        let realLead = await prisma.lead.findFirst({
          where: { organizationId: agent.organizationId, email },
        });

        if (!realLead) {
          realLead = await prisma.lead.create({
            data: {
              organizationId: agent.organizationId,
              email,
              firstName:      firstName ?? conversation.lead?.firstName ?? null,
              lastName:       lastName  ?? conversation.lead?.lastName  ?? null,
              source:         'chat',
              status:         'CONTACTED',
              lastContactedAt: new Date(),
            },
          });

          // Log activity
          await prisma.activity.create({
            data: {
              leadId:      realLead.id,
              type:        'lead_created',
              title:       'Lead identified via chat',
              description: `Email captured during chat session`,
              actorType:   'agent',
              actorId:     agent.id,
            },
          });
        }

        // Link conversation to real lead
        await prisma.conversation.update({
          where: { id: conversation.id },
          data:  { leadId: realLead.id },
        });

        // Delete anonymous placeholder lead
        if (conversation.leadId) {
          await prisma.lead.delete({ where: { id: conversation.leadId } }).catch(() => {});
        }

        // Re-fetch conversation with updated lead
        conversation = await prisma.conversation.findUnique({
          where:   { id: conversation.id },
          include: { lead: true, messages: { orderBy: { createdAt: 'asc' } } },
        }) ?? conversation;
      }
    }

    // ── Save the user's message ───────────────────────────────────────────────
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role:           'user',
        content:        message,
        senderType:     'lead',
      },
    });

    // Update conversation lastMessageAt + messageCount
    await prisma.conversation.update({
      where: { id: conversation.id },
      data:  {
        lastMessageAt: new Date(),
        messageCount:  { increment: 1 },
      },
    });

    // ── Call Groq via brain ───────────────────────────────────────────────────
    const agentResponse = await processAgentMessage(message, {
      agent,
      lead:                conversation.lead,
      conversationHistory: conversation.messages,
      channel:             'chat',
      sessionId:           conversation.sessionId ?? undefined,
    });

    // ── Save the assistant's response ─────────────────────────────────────────
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role:           'assistant',
        content:        agentResponse.message,
        senderType:     'agent',
        quickActions:   agentResponse.quickActions
          ? JSON.parse(JSON.stringify(agentResponse.quickActions))
          : undefined,
      },
    });

    // Update messageCount again for assistant message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data:  {
        lastMessageAt: new Date(),
        messageCount:  { increment: 1 },
      },
    });

    // ── Update lead if agent qualified them ───────────────────────────────────
    if (
      agentResponse.leadUpdates &&
      Object.keys(agentResponse.leadUpdates).length > 0 &&
      conversation.lead
    ) {
      await prisma.lead.update({
        where: { id: conversation.lead.id },
        data:  agentResponse.leadUpdates,
      });

      // Log qualification activity
      if (agentResponse.shouldQualify) {
        await prisma.activity.create({
          data: {
            leadId:      conversation.lead.id,
            type:        'lead_qualified',
            title:       'Lead qualified by AI agent',
            description: `Score: ${(agentResponse.leadUpdates as any).score ?? 'N/A'}/100`,
            actorType:   'agent',
            actorId:     agent.id,
            metadata:    agentResponse.leadUpdates as any,
          },
        });

        // Update agent leadsQualified count
        await prisma.agent.update({
          where: { id: agent.id },
          data:  { leadsQualified: { increment: 1 } },
        });
      }

      // Log meeting booked
      if (agentResponse.shouldBookMeeting && conversation.lead) {
        await prisma.activity.create({
          data: {
            leadId:      conversation.lead.id,
            type:        'meeting_requested',
            title:       'Meeting requested via chat',
            description: 'Lead requested a meeting during AI chat',
            actorType:   'agent',
            actorId:     agent.id,
          },
        });

        // Update conversation flag
        await prisma.conversation.update({
          where: { id: conversation.id },
          data:  { meetingBooked: true },
        });

        // Update agent meetingsBooked count
        await prisma.agent.update({
          where: { id: agent.id },
          data:  { meetingsBooked: { increment: 1 } },
        });
      }
    }

    // ── Update daily metrics ──────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyMetrics.upsert({
      where: {
        organizationId_date: {
          organizationId: agent.organizationId,
          date:           today,
        },
      },
      update: { chatConversations: { increment: 1 } },
      create: {
        organizationId:    agent.organizationId,
        date:              today,
        chatConversations: 1,
      },
    });

    // ── Increment org conversation count ──────────────────────────────────────
    await prisma.organization.update({
      where: { id: agent.organizationId },
      data:  {
        conversationCount: { increment: 1 },
        conversationsUsed: { increment: 1 },
      },
    });

    return NextResponse.json({
      success:      true,
      message:      agentResponse.message,
      quickActions: agentResponse.quickActions ?? [],
      sessionId:    conversation.sessionId,
      leadUpdated:  agentResponse.shouldQualify,
    });

  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:   'Something went wrong. Please try again.',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
      },
      { status: 500 }
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