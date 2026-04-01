import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { LeadsTable } from '@/components/dashboard/LeadsTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (!user?.organizationId) redirect('/sign-in');

  const orgId = user.organizationId;

  // Sequential queries — avoids prepared statement conflict with pgbouncer
  const totalLeads = await prisma.lead.count({
    where: { organizationId: orgId },
  });
  const hotLeads = await prisma.lead.count({
    where: { organizationId: orgId, tier: 'HOT' },
  });
  const totalConversations = await prisma.conversation.count({
    where: { organizationId: orgId },
  });
  const meetingsBooked = await prisma.meeting.count({
    where: { organizationId: orgId },
  });
  const recentLeads = await prisma.lead.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {clerkUser.firstName}!
        </p>
      </div>
      <StatsCards
        stats={{ totalLeads, hotLeads, totalConversations, meetingsBooked }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsTable leads={recentLeads} />
        </CardContent>
      </Card>
    </div>
  );
}