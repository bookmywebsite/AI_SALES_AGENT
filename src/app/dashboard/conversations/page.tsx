import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

export default async function ConversationsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (!user?.organizationId) redirect('/sign-in');

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: user.organizationId },
    take: 50,
  });

  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      const agent = await prisma.agent.findUnique({
        where: { id: conv.agentId },
      });
      const lead = conv.leadId
        ? await prisma.lead.findUnique({ where: { id: conv.leadId } })
        : null;
      const lastMessage = await prisma.message.findFirst({
        where: { conversationId: conv.id },
        orderBy: { id: 'desc' },
      });
      return { ...conv, agent, lead, lastMessage };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          {conversations.length} total conversations
        </p>
      </div>

      {conversationsWithDetails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm">
              Conversations will appear here once leads start chatting with your AI agent.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Lead</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Agent</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Channel</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Last Message</th>
              </tr>
            </thead>
            <tbody>
              {conversationsWithDetails.map((conv) => (
                <tr key={conv.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {conv.lead?.email ?? 'Anonymous'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {conv.agent?.name ?? conv.agentId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{conv.channel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        conv.status === 'ACTIVE' ? 'default' : 'secondary'
                      }
                    >
                      {conv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {conv.lastMessage?.content ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}