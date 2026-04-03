import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { slugify } from '@/lib/utils';

// ── Auto-start cron worker when dashboard loads ───────────────────────────────
// Only starts once — subsequent calls are no-ops
let cronStarted = false;

async function ensureCronStarted() {
  if (cronStarted) return;
  try {
    const { startCronWorker } = await import('@/lib/scheduler/cron');
    startCronWorker();
    cronStarted = true;
  } catch (err) {
    console.error('Failed to start cron:', err);
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  // Start cron worker automatically
  await ensureCronStarted();

  let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

  if (!user) {
    const org = await prisma.organization.create({
      data: {
        name: `${clerkUser.firstName ?? 'My'}'s Org`,
        slug: slugify(`${clerkUser.firstName ?? 'user'}-${Math.random().toString(36).slice(2)}`),
      },
    });

    user = await prisma.user.create({
      data: {
        clerkId:        clerkUser.id,
        email:          clerkUser.emailAddresses[0].emailAddress,
        firstName:      clerkUser.firstName  ?? null,
        lastName:       clerkUser.lastName   ?? null,
        imageUrl:       clerkUser.imageUrl   ?? null,
        organizationId: org.id,
        role:           'owner',
      },
    });

    await prisma.agent.create({
      data: {
        organizationId: org.id,
        name:           'Alex',
        role:           'Sales Representative',
        isDefault:      true,
        isActive:       true,
        welcomeMessage: "Hi! 👋 How can I help you today?",
      },
    });

    await prisma.emailSequence.create({
      data: {
        organizationId: org.id,
        name:           'Default Outreach Sequence',
        isActive:       true,
        steps: {
          create: [
            { stepNumber: 1, name: 'Initial Outreach', delayDays: 0,  useAI: true },
            { stepNumber: 2, name: 'Follow-up #1',     delayDays: 3,  useAI: true },
            { stepNumber: 3, name: 'Follow-up #2',     delayDays: 7,  useAI: true },
            { stepNumber: 4, name: 'Break-up Email',   delayDays: 14, useAI: true },
          ],
        },
      },
    });

  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: clerkUser.firstName ?? user.firstName,
        lastName:  clerkUser.lastName  ?? user.lastName,
        imageUrl:  clerkUser.imageUrl  ?? user.imageUrl,
        email:     clerkUser.emailAddresses[0].emailAddress,
      },
    });
  }

  const agent = user.organizationId ? await prisma.agent.findFirst({
    where: { organizationId: user.organizationId, isDefault: true, isActive: true },
  }) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
      {agent && (
        <ChatWidget
          agentId={agent.id}
          primaryColor="#7C3AED"
          welcomeMessage={agent.welcomeMessage ?? "Hi! 👋 How can I help you today?"}
          agentName={agent.name}
        />
      )}
    </div>
  );
}

// import { currentUser } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';
// import { prisma } from '@/lib/prisma';
// import { Sidebar } from '@/components/dashboard/Sidebar';
// import { ChatWidget } from '@/components/chat/ChatWidget';
// import { slugify } from '@/lib/utils';


// export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const clerkUser = await currentUser();
//   if (!clerkUser) redirect('/sign-in');

//   let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

//   if (!user) {
//     const org = await prisma.organization.create({
//       data: { name: `${clerkUser.firstName}'s Org`, slug: slugify(`${clerkUser.firstName}-${Date.now()}`) },
//     });

//     user = await prisma.user.create({
//       data: {
//         clerkId: clerkUser.id,
//         email: clerkUser.emailAddresses[0].emailAddress,
//         firstName: clerkUser.firstName,
//         lastName: clerkUser.lastName,
//         imageUrl: clerkUser.imageUrl,
//         organizationId: org.id,
//         role: 'owner',
//       },
//     });

//     await prisma.agent.create({
//       data: { organizationId: org.id, name: 'Alex', role: 'Sales Representative', isDefault: true },
//     });
//   }

//   const agent = user.organizationId ? await prisma.agent.findFirst({
//     where: { organizationId: user.organizationId, isDefault: true, isActive: true },
//   }) : null;

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Sidebar />
//       <main className="ml-64 p-8">{children}</main>
//       {agent && (
//         <ChatWidget
//           agentId={agent.id}
//           primaryColor="#7C3AED"
//           welcomeMessage={agent.welcomeMessage ?? 'Hi! How can I help you today?'}
//           agentName={agent.name}
//         />
//       )}
//     </div>
//   );
// }