import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the first default agent across all orgs for the landing page demo
    const agent = await prisma.agent.findFirst({
      where: { isDefault: true, isActive: true },
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'No agent found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}