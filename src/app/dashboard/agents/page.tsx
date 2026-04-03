import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Bot, MessageSquare, Zap, CheckCircle } from 'lucide-react';

export default async function AgentsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user?.organizationId) redirect('/sign-in');

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.organizationId },
  });

  const convCounts = await prisma.conversation.groupBy({
    by: ['agentId'],
    where: { organizationId: user.organizationId },
    _count: { id: true },
  });
  const countMap = Object.fromEntries(convCounts.map(c => [c.agentId, c._count.id]));

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
          AI Agents
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {agents.length} AI agent{agents.length !== 1 ? 's' : ''} configured
        </p>
      </div>

      {agents.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', padding: '60px', textAlign: 'center',
        }}>
          <Bot size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No agents yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {agents.map((agent) => {
            const convCount = countMap[agent.id] ?? 0;
            return (
              <div key={agent.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '24px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Accent glow */}
                <div style={{
                  position: 'absolute', top: '-30px', right: '-30px',
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Agent header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: 'rgba(99,102,241,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={22} style={{ color: '#818cf8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{agent.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{agent.role}</div>
                    </div>
                  </div>
                  {agent.isDefault && (
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                      borderRadius: '100px', background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc',
                    }}>Default</span>
                  )}
                </div>

                {/* Welcome message preview */}
                {agent.welcomeMessage && (
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px', marginBottom: '20px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, fontStyle: 'italic' }}>
                      &ldquo;{agent.welcomeMessage}&rdquo;
                    </p>
                  </div>
                )}

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Conversations', value: convCount,             icon: MessageSquare, color: '#8b5cf6' },
                    { label: 'Status',         value: agent.isActive ? 'Active' : 'Inactive', icon: CheckCircle, color: agent.isActive ? '#10b981' : '#6b7280' },
                    { label: 'Channels',       value: [agent.enableChat && 'Chat', agent.enableEmail && 'Email', agent.enableVoice && 'Voice'].filter(Boolean).length, icon: Zap, color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '12px', borderRadius: '12px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <s.icon size={14} style={{ color: s.color, margin: '0 auto 6px', display: 'block' }} />
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Enabled channels */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {agent.enableChat  && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', fontWeight: 500 }}>💬 Chat</span>}
                  {agent.enableEmail && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontWeight: 500 }}>✉️ Email</span>}
                  {agent.enableVoice && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontWeight: 500 }}>📞 Voice</span>}
                </div>

                {/* Agent ID */}
                <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent ID</div>
                  <code style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{agent.id}</code>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// import { currentUser } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';
// import { prisma } from '@/lib/prisma';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Bot } from 'lucide-react';

// export default async function AgentsPage() {
//   const clerkUser = await currentUser();
//   if (!clerkUser) redirect('/sign-in');

//   const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
//   if (!user?.organizationId) redirect('/sign-in');

//   const agents = await prisma.agent.findMany({
//     where: { organizationId: user.organizationId },
//     include: {
//       _count: { select: { conversations: true } },
//     },
//     orderBy: { createdAt: 'asc' },
//   });

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Agents</h1>
//         <p className="text-muted-foreground">
//           {agents.length} AI agent{agents.length !== 1 ? 's' : ''} configured
//         </p>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//         {agents.map((agent) => (
//           <Card key={agent.id} className="relative">
//             {agent.isDefault && (
//               <div className="absolute top-3 right-3">
//                 <Badge variant="default" className="text-xs">Default</Badge>
//               </div>
//             )}
//             <CardHeader className="pb-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
//                   <Bot className="h-5 w-5 text-primary" />
//                 </div>
//                 <div>
//                   <CardTitle className="text-lg">{agent.name}</CardTitle>
//                   <p className="text-sm text-muted-foreground">{agent.role}</p>
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="rounded-md bg-gray-50 p-3">
//                 <p className="text-sm text-muted-foreground italic">
//                   "{agent.welcomeMessage}"
//                 </p>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-muted-foreground">Conversations</span>
//                 <span className="font-medium">{agent._count.conversations}</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-muted-foreground">Status</span>
//                 <Badge variant={agent.isActive ? 'success' : 'secondary'}>
//                   {agent.isActive ? 'Active' : 'Inactive'}
//                 </Badge>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-muted-foreground">Agent ID</span>
//                 <code className="text-xs bg-gray-100 px-2 py-1 rounded">
//                   {agent.id.slice(0, 12)}...
//                 </code>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }