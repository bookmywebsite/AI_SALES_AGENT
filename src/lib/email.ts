import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import Groq from 'groq-sdk';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
sgClient.setApiKey(process.env.SENDGRID_API_KEY!);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
    to: string;
    toName?: string;
    subject: string;
    html: string;
    text?: string;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
    threadId?: string;
}

export interface GenerateEmailOptions {
    agentName: string;
    agentRole: string;
    companyName?: string;
    companyDescription?: string;
    productDescription?: string;
    valueProposition?: string;
    leadFirstName?: string;
    leadCompany?: string;
    leadJobTitle?: string;
    painPoints?: string[];
    stepNumber: number;
    totalSteps: number;
    previousEmailSubject?: string;
    tone?: string;
}

// ─── Send a single email via SendGrid ─────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<string> {
    const msg = {
        to: { email: options.to, name: options.toName ?? options.to },
        from: {
            email: options.fromEmail ?? process.env.SENDGRID_FROM_EMAIL!,
            name: options.fromName ?? process.env.SENDGRID_FROM_NAME ?? 'u8u.ai',
        },
        replyTo: options.replyTo ?? process.env.SENDGRID_FROM_EMAIL!,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.html.replace(/<[^>]*>/g, ''),
        headers: options.threadId
            ? { 'X-Thread-ID': options.threadId, 'In-Reply-To': options.threadId } as { [key: string]: string }
            : undefined,
        trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true },
        },
    };

    const [response] = await sgMail.send(msg);
    // SendGrid returns message ID in headers
    const messageId = (response.headers as Record<string, string>)['x-message-id'] ?? `sg_${Date.now()}`;
    return messageId;
}

// ─── AI-generate email content via Groq ───────────────────────────────────────

export async function generateEmailContent(
    opts: GenerateEmailOptions
): Promise<{ subject: string; html: string; text: string }> {
    const isFollowUp = opts.stepNumber > 1;

    const prompt = `You are ${opts.agentName}, ${opts.agentRole} at ${opts.companyName ?? 'our company'}.

Write a ${isFollowUp ? 'follow-up' : 'cold outreach'} sales email.

CONTEXT:
- Company: ${opts.companyName ?? 'our company'}
- Product: ${opts.productDescription ?? 'AI sales automation platform'}
- Value Prop: ${opts.valueProposition ?? 'Save time, close more deals'}
- Lead Name: ${opts.leadFirstName ?? 'there'}
- Lead Company: ${opts.leadCompany ?? 'your company'}
- Lead Title: ${opts.leadJobTitle ?? ''}
- Known Pain Points: ${opts.painPoints?.join(', ') ?? 'none yet'}
- Sequence Step: ${opts.stepNumber} of ${opts.totalSteps}
- Tone: ${opts.tone ?? 'conversational'}
${isFollowUp ? `- Following up on: "${opts.previousEmailSubject}"` : ''}

RULES:
- Subject line: max 8 words, no clickbait
- Body: max 120 words, conversational
- ONE clear call to action
- No attachments mentioned
- Do not use "I hope this email finds you well"
- End with a simple question

Respond ONLY in this JSON format (no markdown, no extra text):
{"subject":"...","text":"...","html":"..."}

The html field should be the text wrapped in simple HTML with <p> tags. Keep it plain.`;

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.choices[0].message.content ?? '{}';

    try {
        const parsed = JSON.parse(raw);
        return {
            subject: parsed.subject ?? 'Following up',
            text: parsed.text ?? '',
            html: parsed.html ?? `<p>${parsed.text ?? ''}</p>`,
        };
    } catch {
        // Fallback if JSON parse fails
        return {
            subject: isFollowUp ? `Following up — ${opts.companyName ?? 'u8u.ai'}` : `Quick question, ${opts.leadFirstName ?? 'there'}`,
            text: raw,
            html: `<p>${raw}</p>`,
        };
    }
}

// ─── Enroll lead in a sequence and send step 1 immediately ────────────────────

export async function enrollLeadInSequence(
    sequenceId: string,
    leadId: string,
    prisma: any
): Promise<void> {
    const sequence = await prisma.emailSequence.findUnique({
        where: { id: sequenceId },
        include: { steps: { orderBy: { stepNumber: 'asc' } }, agent: true },
    });

    if (!sequence || !sequence.isActive) return;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return;

    // Check if already enrolled
    const existing = await prisma.sequenceEnrollment.findUnique({
        where: { sequenceId_leadId: { sequenceId, leadId } },
    });
    if (existing) return;

    // Create enrollment
    const enrollment = await prisma.sequenceEnrollment.create({
        data: {
            sequenceId,
            leadId,
            currentStep: 1,
            status: 'active',
            nextStepAt: new Date(),
        },
    });

    // Update sequence stats
    await prisma.emailSequence.update({
        where: { id: sequenceId },
        data: { totalEnrolled: { increment: 1 } },
    });

    // Send step 1 immediately
    const firstStep = sequence.steps[0];
    if (firstStep) {
        await processSequenceStep(enrollment.id, firstStep.id, lead, sequence, prisma);
    }
}

// ─── Process a single sequence step ───────────────────────────────────────────

export async function processSequenceStep(
    enrollmentId: string,
    stepId: string,
    lead: any,
    sequence: any,
    prisma: any
): Promise<void> {
    const step = sequence.steps.find((s: any) => s.id === stepId);
    if (!step || !step.isActive) return;

    // Skip if lead already replied or booked
    if (step.skipIfReplied && lead.status === 'WON') return;
    if (step.skipIfMeeting && lead.status === 'MEETING_SET') return;

    let subject: string;
    let html: string;
    let text: string;

    if (step.useAI) {
        const generated = await generateEmailContent({
            agentName: sequence.agent?.name ?? 'Alex',
            agentRole: sequence.agent?.role ?? 'Sales Representative',
            companyName: sequence.agent?.companyName ?? '',
            companyDescription: sequence.agent?.companyDescription ?? '',
            productDescription: sequence.agent?.productDescription ?? '',
            valueProposition: sequence.agent?.valueProposition ?? '',
            leadFirstName: lead.firstName ?? '',
            leadCompany: lead.company ?? '',
            leadJobTitle: lead.jobTitle ?? '',
            painPoints: lead.painPoints ?? [],
            stepNumber: step.stepNumber,
            totalSteps: sequence.steps.length,
            tone: sequence.agent?.tone ?? 'conversational',
        });
        subject = generated.subject;
        html = generated.html;
        text = generated.text;
    } else {
        // Use template with variable substitution
        subject = (step.subjectTemplate ?? 'Hello {{firstName}}')
            .replace('{{firstName}}', lead.firstName ?? 'there')
            .replace('{{company}}', lead.company ?? 'your company');
        text = (step.bodyTemplate ?? '')
            .replace('{{firstName}}', lead.firstName ?? 'there')
            .replace('{{company}}', lead.company ?? 'your company');
        html = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
    }

    // Send email
    const sendGridId = await sendEmail({
        to: lead.email,
        toName: lead.firstName ?? lead.email,
        subject,
        html,
        text,
    });

    // Save to Email table
    await prisma.email.create({
        data: {
            leadId: lead.id,
            direction: 'outbound',
            subject,
            body: text,
            bodyHtml: html,
            fromEmail: process.env.SENDGRID_FROM_EMAIL!,
            fromName: sequence.agent?.name ?? 'Alex',
            toEmail: lead.email,
            toName: lead.firstName ?? '',
            sequenceId: sequence.id,
            sequenceStep: step.stepNumber,
            status: 'SENT',
            sendGridId,
            sentAt: new Date(),
        },
    });

    // Update lead email stats
    await prisma.lead.update({
        where: { id: lead.id },
        data: {
            emailsSent: { increment: 1 },
            lastContactedAt: new Date(),
            status: lead.status === 'NEW' ? 'CONTACTED' : lead.status,
        },
    });

    // Log activity
    await prisma.activity.create({
        data: {
            leadId: lead.id,
            type: 'email_sent',
            title: `Email sent: ${subject}`,
            description: `Sequence: ${sequence.name} — Step ${step.stepNumber}`,
            actorType: 'agent',
            actorId: sequence.agentId,
        },
    });

    // Update step stats
    await prisma.emailSequenceStep.update({
        where: { id: step.id },
        data: { totalSent: { increment: 1 } },
    });

    // Schedule next step
    const nextStep = sequence.steps.find((s: any) => s.stepNumber === step.stepNumber + 1);
    if (nextStep) {
        const nextStepAt = new Date();
        nextStepAt.setDate(nextStepAt.getDate() + nextStep.delayDays);
        nextStepAt.setHours(nextStepAt.getHours() + nextStep.delayHours);

        await prisma.sequenceEnrollment.update({
            where: { id: enrollmentId },
            data: { currentStep: nextStep.stepNumber, nextStepAt },
        });
    } else {
        // Sequence complete
        await prisma.sequenceEnrollment.update({
            where: { id: enrollmentId },
            data: { status: 'completed', completedAt: new Date() },
        });
        await prisma.emailSequence.update({
            where: { id: sequence.id },
            data: { totalCompleted: { increment: 1 } },
        });
    }
}