import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateEmailContent } from '@/lib/email';

// POST /api/email/send
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, subject, html, text, useAI, agentId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Get user + org
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get lead
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check email limit
    const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (org && org.emailsUsed >= org.emailLimit) {
      return NextResponse.json({ error: 'Email limit reached for your plan' }, { status: 429 });
    }

    let emailSubject = subject;
    let emailHtml    = html;
    let emailText    = text;

    // AI-generate if requested
    if (useAI && agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (agent) {
        const generated = await generateEmailContent({
          agentName:          agent.name,
          agentRole:          agent.role,
          companyName:        agent.companyName    ?? '',
          companyDescription: agent.companyDescription ?? '',
          productDescription: agent.productDescription ?? '',
          valueProposition:   agent.valueProposition   ?? '',
          leadFirstName:      lead.firstName  ?? '',
          leadCompany:        lead.company    ?? '',
          leadJobTitle:       lead.jobTitle   ?? '',
          painPoints:         lead.painPoints ?? [],
          stepNumber:         1,
          totalSteps:         1,
          tone:               agent.tone,
        });
        emailSubject = generated.subject;
        emailHtml    = generated.html;
        emailText    = generated.text;
      }
    }

    if (!emailSubject || !emailHtml) {
      return NextResponse.json({ error: 'subject and html are required' }, { status: 400 });
    }

    // Send via SendGrid
    const sendGridId = await sendEmail({
      to:      lead.email,
      toName:  lead.firstName ?? lead.email,
      subject: emailSubject,
      html:    emailHtml,
      text:    emailText,
    });

    // Save to DB
    const email = await prisma.email.create({
      data: {
        leadId:    lead.id,
        direction: 'outbound',
        subject:   emailSubject,
        body:      emailText ?? emailHtml.replace(/<[^>]*>/g, ''),
        bodyHtml:  emailHtml,
        fromEmail: process.env.SENDGRID_FROM_EMAIL!,
        fromName:  process.env.SENDGRID_FROM_NAME ?? 'u8u.ai',
        toEmail:   lead.email,
        toName:    lead.firstName ?? '',
        status:    'SENT',
        sendGridId,
        sentAt:    new Date(),
      },
    });

    // Update lead + org stats
    await prisma.lead.update({
      where: { id: lead.id },
      data:  { emailsSent: { increment: 1 }, lastContactedAt: new Date() },
    });
    await prisma.organization.update({
      where: { id: user.organizationId },
      data:  { emailsUsed: { increment: 1 } },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId:      lead.id,
        type:        'email_sent',
        title:       `Email sent: ${emailSubject}`,
        description: `Manual email sent to ${lead.email}`,
        actorType:   'user',
        actorId:     user.id,
      },
    });

    return NextResponse.json({ success: true, emailId: email.id, sendGridId });
  } catch (error) {
    console.error('[Email Send] Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}