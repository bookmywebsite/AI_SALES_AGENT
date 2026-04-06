import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ agents: [] });

    const agents = await prisma.agent.findMany({
      where:   { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const convCounts = await prisma.conversation.groupBy({
      by:    ['agentId'],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(convCounts.map(c => [c.agentId, c._count.id]));

    return NextResponse.json({
      agents: agents.map(a => ({ ...a, conversationCount: countMap[a.id] ?? 0 })),
    });
  } catch (error) {
    console.error('[Agents GET]', error);
    return NextResponse.json({ agents: [] });
  }
}