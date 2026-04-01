import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: user.organizationId,
        isDefault: true,
      },
    });

    return NextResponse.json({
      agentId: agent?.id ?? '',
      agentName: agent?.name ?? 'Alex',
    });
  } catch (error) {
    console.error('[Agent Default]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}