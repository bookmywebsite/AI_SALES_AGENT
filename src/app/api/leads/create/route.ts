import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { email, firstName, lastName, company, phone, jobTitle } = body;

    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const lead = await prisma.lead.create({
      data: {
        organizationId: user.organizationId,
        email,
        firstName:  firstName  ?? null,
        lastName:   lastName   ?? null,
        company:    company    ?? null,
        phone:      phone      ?? null,
        jobTitle:   jobTitle   ?? null,
        source:     'manual',
        status:     'NEW',
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Lead with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}