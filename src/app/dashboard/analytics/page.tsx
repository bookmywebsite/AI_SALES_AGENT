import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TrendingUp, Users, Phone, Mail, Calendar, Target } from 'lucide-react';

export default async function AnalyticsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user?.organizationId) redirect('/sign-in');

  const orgId = user.organizationId;

  const totalLeads      = await prisma.lead.count({ where: { organizationId: orgId } });
  const hotLeads        = await prisma.lead.count({ where: { organizationId: orgId, tier: 'HOT' } });
  const wonLeads        = await prisma.lead.count({ where: { organizationId: orgId, status: 'WON' } });
  const qualifiedLeads  = await prisma.lead.count({ where: { organizationId: orgId, status: 'QUALIFIED' } });
  const totalConvs      = await prisma.conversation.count({ where: { organizationId: orgId } });
  const voiceCalls      = await prisma.conversation.count({ where: { organizationId: orgId, channel: 'VOICE' } });
  const emailConvs      = await prisma.conversation.count({ where: { organizationId: orgId, channel: 'EMAIL' } });
  const meetings        = await prisma.meeting.count({ where: { organizationId: orgId } });
  const emailsSent      = await prisma.email.count({ where: { lead: { organizationId: orgId } } });

  const convRate  = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';
  const qualRate  = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';

  const metrics = [
    { label: 'Total Leads',       value: totalLeads,    icon: Users,       color: '#6366f1', sub: `${hotLeads} hot` },
    { label: 'Conversations',     value: totalConvs,    icon: Phone,       color: '#10b981', sub: `${voiceCalls} voice` },
    { label: 'Emails Sent',       value: emailsSent,    icon: Mail,        color: '#06b6d4', sub: `${emailConvs} threads` },
    { label: 'Meetings Booked',   value: meetings,      icon: Calendar,    color: '#a855f7', sub: 'total' },
    { label: 'Qualified Leads',   value: qualifiedLeads, icon: Target,     color: '#f59e0b', sub: `${qualRate}% rate` },
    { label: 'Won Deals',         value: wonLeads,      icon: TrendingUp,  color: '#10b981', sub: `${convRate}% conv.` },
  ];

  const pipelineStages = [
    { label: 'New',         count: await prisma.lead.count({ where: { organizationId: orgId, status: 'NEW' } }),         color: '#6366f1' },
    { label: 'Contacted',   count: await prisma.lead.count({ where: { organizationId: orgId, status: 'CONTACTED' } }),   color: '#06b6d4' },
    { label: 'Engaged',     count: await prisma.lead.count({ where: { organizationId: orgId, status: 'ENGAGED' } }),     color: '#8b5cf6' },
    { label: 'Qualified',   count: qualifiedLeads,                                                                         color: '#10b981' },
    { label: 'Meeting Set', count: await prisma.lead.count({ where: { organizationId: orgId, status: 'MEETING_SET' } }), color: '#a855f7' },
    { label: 'Won',         count: wonLeads,                                                                               color: '#f59e0b' },
    { label: 'Lost',        count: await prisma.lead.count({ where: { organizationId: orgId, status: 'LOST' } }),        color: '#ef4444' },
  ];

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Performance overview</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', marginBottom: '28px' }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '70px', height: '70px', borderRadius: '50%', background: `radial-gradient(circle, ${m.color}22 0%, transparent 70%)` }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <m.icon size={16} style={{ color: m.color }} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>{m.label}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>Lead Pipeline Funnel</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pipelineStages.map(stage => {
            const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
            return (
              <div key={stage.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {stage.count} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: '100px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Channel Breakdown</h3>
          {[
            { label: 'Voice Calls', value: voiceCalls,                              color: '#10b981', pct: totalConvs > 0 ? Math.round((voiceCalls / totalConvs) * 100) : 0 },
            { label: 'Email',       value: emailConvs,                              color: '#6366f1', pct: totalConvs > 0 ? Math.round((emailConvs / totalConvs) * 100) : 0 },
            { label: 'Chat',        value: totalConvs - voiceCalls - emailConvs,    color: '#a855f7', pct: totalConvs > 0 ? Math.round(((totalConvs - voiceCalls - emailConvs) / totalConvs) * 100) : 0 },
          ].map(ch => (
            <div key={ch.label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{ch.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{ch.value} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({ch.pct}%)</span></span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ch.pct}%`, background: ch.color, borderRadius: '100px' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Conversion Metrics</h3>
          {[
            { label: 'Lead → Contacted',  value: `${totalLeads > 0 ? Math.round(((totalLeads - await prisma.lead.count({ where: { organizationId: orgId, status: 'NEW' } })) / totalLeads * 100)) : 0}%` },
            { label: 'Contacted → Qualified', value: `${qualRate}%` },
            { label: 'Qualified → Won',   value: `${convRate}%` },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{m.label}</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// import { currentUser } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';
// import { prisma } from '@/lib/prisma';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';

// export default async function AnalyticsPage() {
//   const clerkUser = await currentUser();
//   if (!clerkUser) redirect('/sign-in');

//   const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
//   if (!user?.organizationId) redirect('/sign-in');

//   const orgId = user.organizationId;

//   const totalLeads       = await prisma.lead.count({ where: { organizationId: orgId } });
//   const hotLeads         = await prisma.lead.count({ where: { organizationId: orgId, tier: 'HOT' } });
//   const warmLeads        = await prisma.lead.count({ where: { organizationId: orgId, tier: 'WARM' } });
//   const coldLeads        = await prisma.lead.count({ where: { organizationId: orgId, tier: 'COLD' } });
//   const wonLeads         = await prisma.lead.count({ where: { organizationId: orgId, status: 'WON' } });
//   const totalConvs       = await prisma.conversation.count({ where: { organizationId: orgId } });
//   const totalMeetings    = await prisma.meeting.count({ where: { organizationId: orgId } });
//   const qualifiedLeads   = await prisma.lead.count({ where: { organizationId: orgId, status: 'QUALIFIED' } });

//   const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';
//   const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0';

//   const stats = [
//     { title: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
//     { title: 'Conversations', value: totalConvs, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
//     { title: 'Meetings Booked', value: totalMeetings, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
//     { title: 'Deals Won', value: wonLeads, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
//   ];

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Analytics</h1>
//         <p className="text-muted-foreground">Track your sales pipeline performance</p>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {stats.map((s) => (
//           <Card key={s.title}>
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">{s.title}</p>
//                   <p className="text-3xl font-bold">{s.value}</p>
//                 </div>
//                 <div className={`rounded-full p-3 ${s.bg}`}>
//                   <s.icon className={`h-6 w-6 ${s.color}`} />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       <div className="grid gap-4 md:grid-cols-2">
//         <Card>
//           <CardHeader>
//             <CardTitle>Lead Breakdown</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             {[
//               { label: 'Hot Leads 🔥', value: hotLeads, color: 'bg-red-500' },
//               { label: 'Warm Leads 🌤️', value: warmLeads, color: 'bg-yellow-500' },
//               { label: 'Cold Leads ❄️', value: coldLeads, color: 'bg-blue-500' },
//             ].map((item) => (
//               <div key={item.label} className="flex items-center justify-between">
//                 <span className="text-sm">{item.label}</span>
//                 <div className="flex items-center gap-3">
//                   <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
//                     <div
//                       className={`h-full ${item.color} rounded-full`}
//                       style={{ width: totalLeads > 0 ? `${(item.value / totalLeads) * 100}%` : '0%' }}
//                     />
//                   </div>
//                   <span className="text-sm font-medium w-6 text-right">{item.value}</span>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Conversion Metrics</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {[
//               { label: 'Qualification Rate', value: `${qualificationRate}%`, sub: `${qualifiedLeads} of ${totalLeads} leads qualified` },
//               { label: 'Win Rate', value: `${conversionRate}%`, sub: `${wonLeads} of ${totalLeads} leads won` },
//               { label: 'Meeting Rate', value: totalLeads > 0 ? `${((totalMeetings / totalLeads) * 100).toFixed(1)}%` : '0%', sub: `${totalMeetings} meetings from ${totalLeads} leads` },
//             ].map((m) => (
//               <div key={m.label} className="flex items-center justify-between py-2 border-b last:border-0">
//                 <div>
//                   <p className="text-sm font-medium">{m.label}</p>
//                   <p className="text-xs text-muted-foreground">{m.sub}</p>
//                 </div>
//                 <span className="text-2xl font-bold text-primary">{m.value}</span>
//               </div>
//             ))}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }