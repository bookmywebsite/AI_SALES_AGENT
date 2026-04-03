import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { slugify } from '@/lib/utils';

let cronStarted = false;

async function ensureCronStarted() {
  if (cronStarted) return;
  try {
    const { startCronWorker } = await import('@/lib/scheduler/cron');
    startCronWorker();
    cronStarted = true;
  } catch {}
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  await ensureCronStarted();

  let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

  if (!user) {
    const org = await prisma.organization.create({
      data: {
        name: `${clerkUser.firstName ?? 'My'}'s Org`,
        slug: slugify(`${clerkUser.firstName ?? 'user'}-${clerkUser.id.slice(-8)}`),
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

  const agent = user.organizationId
    ? await prisma.agent.findFirst({
        where: { organizationId: user.organizationId, isDefault: true, isActive: true },
      })
    : null;

  return (
    // ── Full page dark background ──────────────────────────────────────
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Ambient background orbs — fixed, behind everything */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div style={{
        flex: 1,
        marginLeft: '220px',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top header bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          height: '56px',
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#10b981', boxShadow: '0 0 6px #10b981',
            }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              System Online
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600, color: '#818cf8',
            }}>
              {clerkUser.firstName?.[0] ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, color: '#fff' }}>
          {children}
        </main>
      </div>

      {/* Chat widget */}
      {agent && (
        <ChatWidget
          agentId={agent.id}
          primaryColor="#6366f1"
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

// // ── Auto-start cron worker when dashboard loads ───────────────────────────────
// // Only starts once — subsequent calls are no-ops
// let cronStarted = false;

// async function ensureCronStarted() {
//   if (cronStarted) return;
//   try {
//     const { startCronWorker } = await import('@/lib/scheduler/cron');
//     startCronWorker();
//     cronStarted = true;
//   } catch (err) {
//     console.error('Failed to start cron:', err);
//   }
// }

// export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const clerkUser = await currentUser();
//   if (!clerkUser) redirect('/sign-in');

//   // Start cron worker automatically
//   await ensureCronStarted();

//   let user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

//   if (!user) {
//     const org = await prisma.organization.create({
//       data: {
//         name: `${clerkUser.firstName ?? 'My'}'s Org`,
//         slug: slugify(`${clerkUser.firstName ?? 'user'}-${clerkUser.id.slice(-8)}`),
//       },
//     });

//     user = await prisma.user.create({
//       data: {
//         clerkId:        clerkUser.id,
//         email:          clerkUser.emailAddresses[0].emailAddress,
//         firstName:      clerkUser.firstName  ?? null,
//         lastName:       clerkUser.lastName   ?? null,
//         imageUrl:       clerkUser.imageUrl   ?? null,
//         organizationId: org.id,
//         role:           'owner',
//       },
//     });

//     await prisma.agent.create({
//       data: {
//         organizationId: org.id,
//         name:           'Alex',
//         role:           'Sales Representative',
//         isDefault:      true,
//         isActive:       true,
//         welcomeMessage: "Hi! 👋 How can I help you today?",
//       },
//     });

//     await prisma.emailSequence.create({
//       data: {
//         organizationId: org.id,
//         name:           'Default Outreach Sequence',
//         isActive:       true,
//         steps: {
//           create: [
//             { stepNumber: 1, name: 'Initial Outreach', delayDays: 0,  useAI: true },
//             { stepNumber: 2, name: 'Follow-up #1',     delayDays: 3,  useAI: true },
//             { stepNumber: 3, name: 'Follow-up #2',     delayDays: 7,  useAI: true },
//             { stepNumber: 4, name: 'Break-up Email',   delayDays: 14, useAI: true },
//           ],
//         },
//       },
//     });

//   } else {
//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         firstName: clerkUser.firstName ?? user.firstName,
//         lastName:  clerkUser.lastName  ?? user.lastName,
//         imageUrl:  clerkUser.imageUrl  ?? user.imageUrl,
//         email:     clerkUser.emailAddresses[0].emailAddress,
//       },
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
//           welcomeMessage={agent.welcomeMessage ?? "Hi! 👋 How can I help you today?"}
//           agentName={agent.name}
//         />
//       )}
//     </div>
//   );
// }

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