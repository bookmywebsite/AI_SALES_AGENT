import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { sessionId } = await auth();

    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId); // ← client, not clerkClient
    }
  } catch {
    // Session already invalid — ignore
  }

  return NextResponse.json({ success: true });
}



// import { clerkClient } from '@clerk/nextjs/server';
// import { NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';

// export async function POST() {

//   try {
//     const { sessionId } = await auth();
//     if (sessionId) {
//         const client = await clerkClient();
//         await clerkClient.sessions.revokeSession(sessionId);
//     }
//     // Clerk handles session invalidation via middleware on redirect
//     // This route just returns success — the client redirects to /sign-in
//     // which Clerk's middleware will clear the session cookie
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Sign out failed' },
//       { status: 500 }
//     );
//   }
// }