import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/leads
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const tier   = searchParams.get('tier');
    const status = searchParams.get('status');

    const where: any = { organizationId: user.organizationId };
    if (tier)   where.tier   = tier;
    if (status) where.status = status;

    // Exclude anonymous leads
    where.NOT = { email: { endsWith: '@chat.PrimePro.ai' } };

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    100,
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        company:   true,
        phone:     true,
        score:     true,
        tier:      true,
        status:    true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}