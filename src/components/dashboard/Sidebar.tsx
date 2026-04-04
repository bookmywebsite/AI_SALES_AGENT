'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, MessageSquare, Bot,
  Mail, BarChart3, Settings, LogOut, Target, Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/leads',         label: 'Leads',         icon: Users },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/dashboard/agents',        label: 'AI Agents',     icon: Bot },
  { href: '/dashboard/assignment',    label: 'Assignment',    icon: Target },
  { href: '/dashboard/sequences',     label: 'Sequences',     icon: Mail },
  { href: '/dashboard/analytics',     label: 'Analytics',     icon: BarChart3 },
  { href: '/dashboard/settings',      label: 'Settings',      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try { await fetch('/api/auth/signout', { method: 'POST' }); } catch {}
    window.location.replace('/');
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, zIndex: 40,
      height: '100vh', width: '220px',
      background: '#0d0d14',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Logo */}
      <div style={{
        height: '60px', display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            PrimePro<span style={{ color: '#818cf8' }}>.ai</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <item.icon size={15} style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '9px 12px', borderRadius: '10px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.35)',
            transition: 'all 0.15s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}