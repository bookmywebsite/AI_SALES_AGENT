'use client';
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Bot,
    Mail,
    BarChart3,
    Settings,
    LogOut,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/leads', label: 'Leads', icon: Users },
    { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
    { href: '/dashboard/agents', label: 'AI Agents', icon: Bot },
    { href: '/dashboard/assignment', label: 'Assignment', icon: Users },
    { href: '/dashboard/sequences', label: 'Sequences', icon: Mail },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        await signOut({ redirectUrl: '/' });  // Clerk clears session + redirects
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white flex flex-col">

            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6 shrink-0">
                <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                    u8u<span className="text-primary">.ai</span>
                </Link>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                            isActive(item.href)
                                ? 'bg-primary text-gray-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                    >
                        <item.icon className="h-4 w-4 shrink-0 text-gray-600" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Sign out */}
            <div className="shrink-0 border-t p-3">
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                </button>
            </div>

        </aside>
    );
}