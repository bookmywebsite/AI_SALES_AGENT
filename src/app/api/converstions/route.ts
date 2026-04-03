import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const cursor = searchParams.get('cursor');

    const conversations = await prisma.conversation.findMany({
      where:   { organizationId: user.organizationId },
      orderBy: { startedAt: 'desc' },
      take:    limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        lead: {
          select: {
            firstName: true, lastName: true,
            email: true, company: true,
          },
        },
      },
    });

    return NextResponse.json({ conversations }, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('[Conversations API]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}