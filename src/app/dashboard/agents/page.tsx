import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

export default async function AgentsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user?.organizationId) redirect('/sign-in');

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.organizationId },
    include: {
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground">
          {agents.length} AI agent{agents.length !== 1 ? 's' : ''} configured
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="relative">
            {agent.isDefault && (
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="text-xs">Default</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm text-muted-foreground italic">
                  "{agent.welcomeMessage}"
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversations</span>
                <span className="font-medium">{agent._count.conversations}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={agent.isActive ? 'success' : 'secondary'}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agent ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {agent.id.slice(0, 12)}...
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}