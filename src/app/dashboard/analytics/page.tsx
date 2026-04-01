import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';

export default async function AnalyticsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user?.organizationId) redirect('/sign-in');

  const orgId = user.organizationId;

  const totalLeads       = await prisma.lead.count({ where: { organizationId: orgId } });
  const hotLeads         = await prisma.lead.count({ where: { organizationId: orgId, tier: 'HOT' } });
  const warmLeads        = await prisma.lead.count({ where: { organizationId: orgId, tier: 'WARM' } });
  const coldLeads        = await prisma.lead.count({ where: { organizationId: orgId, tier: 'COLD' } });
  const wonLeads         = await prisma.lead.count({ where: { organizationId: orgId, status: 'WON' } });
  const totalConvs       = await prisma.conversation.count({ where: { organizationId: orgId } });
  const totalMeetings    = await prisma.meeting.count({ where: { organizationId: orgId } });
  const qualifiedLeads   = await prisma.lead.count({ where: { organizationId: orgId, status: 'QUALIFIED' } });

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';
  const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';

  const stats = [
    { title: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Conversations', value: totalConvs, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Meetings Booked', value: totalMeetings, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Deals Won', value: wonLeads, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your sales pipeline performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </div>
                <div className={`rounded-full p-3 ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Hot Leads 🔥', value: hotLeads, color: 'bg-red-500' },
              { label: 'Warm Leads 🌤️', value: warmLeads, color: 'bg-yellow-500' },
              { label: 'Cold Leads ❄️', value: coldLeads, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: totalLeads > 0 ? `${(item.value / totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Qualification Rate', value: `${qualificationRate}%`, sub: `${qualifiedLeads} of ${totalLeads} leads qualified` },
              { label: 'Win Rate', value: `${conversionRate}%`, sub: `${wonLeads} of ${totalLeads} leads won` },
              { label: 'Meeting Rate', value: totalLeads > 0 ? `${((totalMeetings / totalLeads) * 100).toFixed(1)}%` : '0%', sub: `${totalMeetings} meetings from ${totalLeads} leads` },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
                <span className="text-2xl font-bold text-primary">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}