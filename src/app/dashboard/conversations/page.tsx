import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Phone, Mail, MessageSquare } from 'lucide-react';

const CH_COLOR: Record<string, string> = { VOICE: '#10b981', EMAIL: '#6366f1', CHAT: '#a855f7' };
const ST_COLOR: Record<string, string> = { ACTIVE: '#10b981', WAITING: '#f59e0b', CLOSED: '#6b7280', TRANSFERRED: '#06b6d4' };

export default async function ConversationsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user?.organizationId) redirect('/sign-in');

  const conversations = await prisma.conversation.findMany({
    where:   { organizationId: user.organizationId },
    orderBy: { startedAt: 'desc' },
    take:    50,
    include: { lead: { select: { firstName: true, lastName: true, email: true, company: true } } },
  });

  const messageCountsRaw = await prisma.message.groupBy({
    by:    ['conversationId'],
    where: { conversationId: { in: conversations.map(c => c.id) } },
    _count: { id: true },
  });
  const msgCounts = Object.fromEntries(messageCountsRaw.map(r => [r.conversationId, r._count.id]));

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Conversations</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{conversations.length} total conversations</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Voice Calls', count: conversations.filter(c => c.channel === 'VOICE').length, color: '#10b981', icon: Phone },
          { label: 'Email',       count: conversations.filter(c => c.channel === 'EMAIL').length, color: '#6366f1', icon: Mail },
          { label: 'Chat',        count: conversations.filter(c => c.channel === 'CHAT').length,  color: '#a855f7', icon: MessageSquare },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{s.count}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Lead', 'Channel', 'Status', 'Messages', 'Started'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No conversations yet</div>
        ) : conversations.map((conv, i) => {
          const lead = conv.lead;
          const name = lead?.firstName ?? lead?.email?.split('@')[0] ?? 'Anonymous';
          const ch   = conv.channel as string;
          const st   = conv.status  as string;
          const ChIcon = ch === 'VOICE' ? Phone : ch === 'EMAIL' ? Mail : MessageSquare;

          return (
            <div key={conv.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              alignItems: 'center', padding: '12px 20px',
              borderBottom: i < conversations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>{name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>{lead?.company ?? lead?.email ?? ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChIcon size={13} style={{ color: CH_COLOR[ch] ?? '#888' }} />
                <span style={{ fontSize: '12px', color: CH_COLOR[ch] ?? '#888', fontWeight: 500 }}>{ch}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px', background: `${ST_COLOR[st] ?? '#888'}18`, color: ST_COLOR[st] ?? '#888' }}>{st}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{msgCounts[conv.id] ?? 0}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
                {new Date(conv.startedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// import { currentUser } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';
// import { prisma } from '@/lib/prisma';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { MessageSquare } from 'lucide-react';

// export default async function ConversationsPage() {
//   const clerkUser = await currentUser();
//   if (!clerkUser) redirect('/sign-in');

//   const user = await prisma.user.findUnique({
//     where: { clerkId: clerkUser.id },
//   });
//   if (!user?.organizationId) redirect('/sign-in');

//   const conversations = await prisma.conversation.findMany({
//     where: { organizationId: user.organizationId },
//     take: 50,
//   });

//   const conversationsWithDetails = await Promise.all(
//     conversations.map(async (conv) => {
//       const agent = await prisma.agent.findUnique({
//         where: { id: conv.agentId },
//       });
//       const lead = conv.leadId
//         ? await prisma.lead.findUnique({ where: { id: conv.leadId } })
//         : null;
//       const lastMessage = await prisma.message.findFirst({
//         where: { conversationId: conv.id },
//         orderBy: { id: 'desc' },
//       });
//       return { ...conv, agent, lead, lastMessage };
//     })
//   );

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Conversations</h1>
//         <p className="text-muted-foreground">
//           {conversations.length} total conversations
//         </p>
//       </div>

//       {conversationsWithDetails.length === 0 ? (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-16 text-center">
//             <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
//             <p className="text-muted-foreground text-sm">
//               Conversations will appear here once leads start chatting with your AI agent.
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="rounded-lg border overflow-hidden">
//           <table className="w-full">
//             <thead className="border-b bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium">Lead</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium">Agent</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium">Channel</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium">Last Message</th>
//               </tr>
//             </thead>
//             <tbody>
//               {conversationsWithDetails.map((conv) => (
//                 <tr key={conv.id} className="border-b hover:bg-gray-50">
//                   <td className="px-4 py-3 text-sm">
//                     {conv.lead?.email ?? 'Anonymous'}
//                   </td>
//                   <td className="px-4 py-3 text-sm">
//                     {conv.agent?.name ?? conv.agentId}
//                   </td>
//                   <td className="px-4 py-3">
//                     <Badge variant="outline">{conv.channel}</Badge>
//                   </td>
//                   <td className="px-4 py-3">
//                     <Badge
//                       variant={
//                         conv.status === 'ACTIVE' ? 'default' : 'secondary'
//                       }
//                     >
//                       {conv.status}
//                     </Badge>
//                   </td>
//                   <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
//                     {conv.lastMessage?.content ?? '—'}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }