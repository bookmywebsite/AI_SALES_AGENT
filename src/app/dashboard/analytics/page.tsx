'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Phone, Mail, Calendar, Target } from 'lucide-react';

function Skeleton({ w, h, r = '8px' }: { w: string; h: string; r?: string }) {
    return <div style={{ width: w, height: h, borderRadius: r, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(r => r.json())
            .then(d => { setStats(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const metrics = [
        { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Users, color: '#6366f1', sub: `${stats?.hotLeads ?? 0} hot` },
        { label: 'Conversations', value: stats?.totalConversations ?? 0, icon: Phone, color: '#10b981', sub: `${stats?.voiceCalls ?? 0} voice` },
        { label: 'Meetings Booked', value: stats?.meetingsBooked ?? 0, icon: Calendar, color: '#a855f7', sub: 'total' },
        { label: 'Qualified Leads', value: stats?.qualifiedLeads ?? 0, icon: Target, color: '#f59e0b', sub: `${stats?.qualRate ?? 0}% rate` },
        { label: 'Won Deals', value: stats?.wonLeads ?? 0, icon: TrendingUp, color: '#10b981', sub: `${stats?.convRate ?? '0.0'}% conv.` },
        { label: 'Pending Calls', value: stats?.scheduledJobs ?? 0, icon: Mail, color: '#06b6d4', sub: 'scheduled' },
    ];

    const pipeline = [
        { label: 'New', count: stats?.newLeads ?? 0, color: '#6366f1' },
        { label: 'Contacted', count: stats?.contactedLeads ?? 0, color: '#06b6d4' },
        { label: 'Qualified', count: stats?.qualifiedLeads ?? 0, color: '#10b981' },
        { label: 'Meeting Set', count: stats?.meetingSetLeads ?? 0, color: '#a855f7' },
        { label: 'Won', count: stats?.wonLeads ?? 0, color: '#f59e0b' },
        { label: 'Lost', count: stats?.lostLeads ?? 0, color: '#ef4444' },
    ];

    const total = stats?.totalLeads ?? 1;

    return (
        <div style={{ padding: '28px 32px', background: '#0a0a0f', minHeight: '100%' }}>
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Analytics</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Performance overview</p>
            </div>

            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px', marginBottom: '24px' }}>
                {metrics.map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '70px', height: '70px', borderRadius: '50%', background: `radial-gradient(circle, ${m.color}22 0%, transparent 70%)` }} />
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                            <m.icon size={16} style={{ color: m.color }} />
                        </div>
                        {loading ? (
                            <><Skeleton w="48px" h="26px" r="4px" /><div style={{ marginTop: '6px' }}><Skeleton w="70px" h="12px" r="4px" /></div></>
                        ) : (
                            <>
                                <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>{m.label}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>{m.sub}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Pipeline funnel */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '0 0 20px' }}>Lead Pipeline Funnel</h2>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} w="100%" h="24px" r="6px" />)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {pipeline.map(stage => {
                            const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
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
                )}
            </div>

            {/* Channel + Conversion */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Channel Breakdown</h3>
                    {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{[1, 2, 3].map(i => <Skeleton key={i} w="100%" h="20px" r="4px" />)}</div> : (
                        [
                            { label: 'Voice Calls', value: stats?.voiceCalls ?? 0, color: '#10b981', total: stats?.totalConversations ?? 1 },
                            { label: 'Email', value: stats?.emailConvs ?? 0, color: '#6366f1', total: stats?.totalConversations ?? 1 },
                            { label: 'Chat', value: stats?.chatConvs ?? 0, color: '#a855f7', total: stats?.totalConversations ?? 1 },
                        ].map(ch => {
                            const pct = ch.total > 0 ? Math.round((ch.value / ch.total) * 100) : 0;
                            return (
                                <div key={ch.label} style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{ch.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{ch.value} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span></span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: ch.color, borderRadius: '100px' }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Conversion Metrics</h3>
                    {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{[1, 2, 3].map(i => <Skeleton key={i} w="100%" h="28px" r="4px" />)}</div> : (
                        [
                            { label: 'Contact Rate', value: `${stats?.contactRate ?? 0}%` },
                            { label: 'Qualified Rate', value: `${stats?.qualRate ?? 0}%` },
                            { label: 'Won Rate', value: `${stats?.convRate ?? '0.0'}%` },
                        ].map(m => (
                            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{m.label}</span>
                                <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{m.value}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
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