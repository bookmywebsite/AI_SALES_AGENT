import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import {
  scheduleJob,
  processPendingJobs,
  scheduleFollowUp,
  scheduleBulkFollowUps,
} from '@/lib/scheduler/scheduler';

// POST /api/scheduler — create a scheduled job
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user?.organizationId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { action, leadId, agentId, type, scheduledFor, delayHours, leadIds } = body;

    // Get default agent if not provided
    let resolvedAgentId = agentId;
    if (!resolvedAgentId) {
      const agent = await prisma.agent.findFirst({
        where: { organizationId: user.organizationId, isDefault: true, isActive: true },
      });
      resolvedAgentId = agent?.id;
    }

    switch (action) {
      case 'schedule': {
        if (!leadId || !type) {
          return NextResponse.json({ error: 'leadId and type required' }, { status: 400 });
        }
        const jobId = await scheduleJob({
          type,
          leadId,
          agentId:      resolvedAgentId,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        });
        return NextResponse.json({ success: true, jobId });
      }

      case 'follow_up': {
        if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });
        const jobId = await scheduleFollowUp(
          leadId,
          resolvedAgentId!,
          delayHours ?? 24
        );
        return NextResponse.json({ success: true, jobId });
      }

      case 'bulk_follow_up': {
        const count = await scheduleBulkFollowUps(user.organizationId, resolvedAgentId!);
        return NextResponse.json({ success: true, scheduled: count });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Scheduler API]', error);
    return NextResponse.json({ error: error.message ?? 'Failed' }, { status: 500 });
  }
}

// GET /api/scheduler — list pending/recent jobs
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jobs = await (prisma as any).scheduledJob.findMany({
      where:   { status: { in: ['PENDING', 'PROCESSING', 'FAILED'] } },
      orderBy: { scheduledFor: 'asc' },
      take:    50,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}