'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Phone, MessageSquare, Calendar,
  TrendingUp, Mail, Zap, Bot, ArrowUpRight,
  Target, Activity, Clock,
} from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, r = '8px' }: { w: string; h: string; r?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'rgba(255,255,255,0.06)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent, trend, loading }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; accent: string; trend?: string; loading?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend && !loading && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 500, color: '#10b981' }}>
            <ArrowUpRight size={12} />{trend}
          </span>
        )}
      </div>
      {loading ? (
        <><Skeleton w="60px" h="28px" r="6px" /><div style={{ marginTop: '8px' }}><Skeleton w="80px" h="13px" r="4px" /></div></>
      ) : (
        <>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '6px' }}>{label}</div>
          {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{sub}</div>}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<any>(null);
  const [leads, setLeads]     = useState<any[]>([]);
  const [convs, setConvs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data in parallel from fast API routes
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/leads?limit=8').then(r => r.json()).catch(() => ({})),
      fetch('/api/conversations?limit=5').then(r => r.json()).catch(() => ({})),
    ]).then(([statsData, leadsData, convsData]) => {
      setStats(statsData);
      setLeads(leadsData.leads ?? []);
      setConvs(convsData.conversations ?? []);
      setLoading(false);
    });
  }, []);

  const TIER_COLOR:   Record<string, string> = { HOT: '#ef4444', WARM: '#f59e0b', COLD: '#6b7280' };
  const STATUS_COLOR: Record<string, string> = { NEW: '#6366f1', CONTACTED: '#06b6d4', ENGAGED: '#8b5cf6', QUALIFIED: '#10b981', MEETING_SET: '#a855f7', WON: '#10b981', LOST: '#6b7280' };
  const CH_COLOR:     Record<string, string> = { VOICE: '#10b981', EMAIL: '#6366f1', CHAT: '#a855f7' };

  const pipeline = stats ? [
    { label: 'New',         count: stats.newLeads ?? 0,         color: '#6366f1' },
    { label: 'Contacted',   count: stats.contactedLeads ?? 0,   color: '#06b6d4' },
    { label: 'Qualified',   count: stats.qualifiedLeads ?? 0,   color: '#10b981' },
    { label: 'Meeting Set', count: stats.meetingSetLeads ?? 0,  color: '#a855f7' },
    { label: 'Won',         count: stats.wonLeads ?? 0,         color: '#f59e0b' },
  ] : [];

  return (
    <div style={{ padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {loading ? 'Loading...' : `${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '12px', fontWeight: 500, color: '#10b981' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
            Live
          </div>
          <Link href="/dashboard/leads">
            <button style={{ padding: '8px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Add Lead
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Leads"     value={stats?.totalLeads ?? 0}        icon={Users}        accent="#6366f1" trend="+today"    loading={loading} />
        <StatCard label="Hot Leads"       value={stats?.hotLeads ?? 0}          icon={Zap}          accent="#ef4444" sub={`${stats?.warmLeads ?? 0} warm`} loading={loading} />
        <StatCard label="Conversations"   value={stats?.totalConversations ?? 0} icon={MessageSquare} accent="#8b5cf6" sub={`${stats?.voiceCalls ?? 0} calls`} loading={loading} />
        <StatCard label="Meetings Booked" value={stats?.meetingsBooked ?? 0}    icon={Calendar}     accent="#a855f7" loading={loading} />
        <StatCard label="Qualified Leads" value={stats?.qualifiedLeads ?? 0}    icon={Target}       accent="#10b981" sub={`${stats?.convRate ?? '0.0'}% conv.`} loading={loading} />
        <StatCard label="Pending Calls"   value={stats?.scheduledJobs ?? 0}     icon={Clock}        accent="#f59e0b" sub="scheduled jobs" loading={loading} />
      </div>

      {/* Pipeline */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>Sales Pipeline</h2>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{stats?.totalLeads ?? '—'} total leads</span>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {[1,2,3,4,5].map(i => <div key={i}><Skeleton w="100%" h="36px" r="8px" /></div>)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {pipeline.map((stage) => {
              const pct = (stats?.totalLeads ?? 0) > 0 ? Math.round((stage.count / stats.totalLeads) * 100) : 0;
              return (
                <div key={stage.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{stage.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{stage.count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: '100px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

        {/* Recent Leads */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#fff' }}>Recent Leads</h2>
            <Link href="/dashboard/leads" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '12px 20px', marginTop: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Lead', 'Company', 'Tier', 'Status'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} w="100%" h="32px" r="8px" />)}
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No leads yet</div>
          ) : leads.map((lead, i) => (
            <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', alignItems: 'center', padding: '11px 20px', borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#818cf8', flexShrink: 0 }}>
                  {(lead.firstName?.[0] ?? lead.email[0]).toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.firstName ?? lead.email.split('@')[0]}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company ?? '—'}</div>
              <div>{lead.tier && <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '100px', background: `${TIER_COLOR[lead.tier]}18`, color: TIER_COLOR[lead.tier] }}>{lead.tier}</span>}</div>
              <div><span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '100px', background: `${STATUS_COLOR[lead.status] ?? '#6366f1'}18`, color: STATUS_COLOR[lead.status] ?? '#6366f1' }}>{lead.status}</span></div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Actions */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 14px', color: '#fff' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Leads',         href: '/dashboard/leads',        color: '#6366f1', icon: Users },
                { label: 'Conversations', href: '/dashboard/conversations', color: '#8b5cf6', icon: MessageSquare },
                { label: 'Assignment',    href: '/dashboard/assignment',    color: '#10b981', icon: Target },
                { label: 'Sequences',     href: '/dashboard/sequences',     color: '#f59e0b', icon: Mail },
                { label: 'Analytics',     href: '/dashboard/analytics',     color: '#06b6d4', icon: TrendingUp },
                { label: 'Settings',      href: '/dashboard/settings',      color: '#a855f7', icon: Zap },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 11px', borderRadius: '10px', background: `${item.color}10`, border: `1px solid ${item.color}20`, cursor: 'pointer' }}>
                    <item.icon size={13} style={{ color: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#fff' }}>Recent Activity</h2>
              <Link href="/dashboard/conversations" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <Skeleton key={i} w="100%" h="40px" r="8px" />)}
              </div>
            ) : convs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No activity yet</p>
            ) : convs.map((conv, i) => {
              const ch = conv.channel as string;
              const lead = conv.lead;
              const name = lead?.firstName ?? lead?.email?.split('@')[0] ?? 'Anonymous';
              return (
                <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < convs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${CH_COLOR[ch] ?? '#888'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ch === 'VOICE' ? <Phone size={13} style={{ color: CH_COLOR[ch] }} /> : ch === 'EMAIL' ? <Mail size={13} style={{ color: CH_COLOR[ch] }} /> : <MessageSquare size={13} style={{ color: CH_COLOR[ch] ?? '#888' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{ch} · {conv.status}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {new Date(conv.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
        {[
          { title: 'Engagement', color: '#06b6d4', icon: Activity,
            rows: loading ? [] : [
              { label: 'Contact Rate',   value: `${stats?.contactRate ?? 0}%`,  color: '#6366f1' },
              { label: 'Qualified Rate', value: `${stats?.qualRate ?? 0}%`,     color: '#10b981' },
              { label: 'Conversion',     value: `${stats?.convRate ?? '0.0'}%`, color: '#f59e0b' },
            ]},
          { title: 'Channels', color: '#8b5cf6', icon: Bot,
            rows: loading ? [] : [
              { label: 'Voice',  value: stats?.voiceCalls ?? 0,  color: '#10b981' },
              { label: 'Email',  value: stats?.emailConvs ?? 0,  color: '#6366f1' },
              { label: 'Chat',   value: stats?.chatConvs ?? 0,   color: '#a855f7' },
            ]},
          { title: 'Lead Tiers', color: '#f59e0b', icon: TrendingUp,
            rows: loading ? [] : [
              { label: 'Hot',  value: stats?.hotLeads ?? 0,  color: '#ef4444' },
              { label: 'Warm', value: stats?.warmLeads ?? 0, color: '#f59e0b' },
              { label: 'Cold', value: (stats?.totalLeads ?? 0) - (stats?.hotLeads ?? 0) - (stats?.warmLeads ?? 0), color: '#6b7280' },
            ]},
        ].map(panel => (
          <div key={panel.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <panel.icon size={15} style={{ color: panel.color }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>{panel.title}</h3>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => <Skeleton key={i} w="100%" h="20px" r="4px" />)}
              </div>
            ) : panel.rows.map((row: any) => {
              const total = panel.title === 'Channels'
                ? (stats?.totalConversations ?? 1)
                : panel.title === 'Lead Tiers'
                ? (stats?.totalLeads ?? 1)
                : 100;
              const pct = total > 0 ? Math.min(100, Math.round((Number(row.value.toString().replace('%','')) / total) * 100)) : 0;
              const displayPct = panel.title === 'Engagement' ? 100 : pct;
              return (
                <div key={row.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{row.value}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${displayPct}%`, background: row.color, borderRadius: '100px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* CSS for skeleton animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}


// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Bot, Mail, Phone, BarChart3, Calendar, Shield, ArrowRight, CheckCircle, MessageCircle, MessageCirclePlus, SquareKanbanIcon, Workflow } from 'lucide-react';
// import { Agent } from 'http';
// // import { LandingChat } from '@/components/chat/LandingChat';

// export default function HomePage() {
//   const features = [
//     { icon: MessageCirclePlus, title: '24/7 AI Chat', description: 'Engage visitors instantly with intelligent conversations' },
//     { icon: Mail, title: 'Email Automation', description: 'Automated personalized outreach that converts' },
//     { icon: Phone, title: 'Voice AI Calls', description: 'Natural phone conversations powered by AI' },
//     { icon: BarChart3, title: 'BANT Scoring', description: 'Automatic lead qualification with AI' },
//     { icon: Calendar, title: 'Meeting Booking', description: 'Seamless calendar integration' },
//     { icon: Shield, title: 'Enterprise Ready', description: 'Secure, scalable, reliable' },
//     { icon: Bot, title: 'Custom AI Agents', description: 'Tailor agents to your unique sales process' },
//     { icon: SquareKanbanIcon, title: 'CRM Integration', description: 'Sync data with your CRM in real-time' },
//     { icon: Workflow, title: 'Full Automation', description: 'Engage leads on their preferred channels' },
//   ];

//   const plans = [
//     { name: 'Free', price: '₹0', conversations: '50', features: ['Chat only', '1 Agent', 'Basic analytics'] },
//     { name: 'Starter', price: '₹1,999', conversations: '200', features: ['Chat + Email', '2 Agents', 'BANT scoring', 'Email sequences'] },
//     { name: 'Growth', price: '₹4,999', conversations: '500', features: ['All channels', '5 Agents', 'CRM sync', 'Priority support'], popular: true },
//     { name: 'Pro', price: '₹9,999', conversations: '2000', features: ['Everything', 'Unlimited agents', 'Voice calls', 'API access', 'Custom training'] },
//   ];

//   return (
//     <div className="min-h-screen bg-white">
//       <header className="border-b">
//         <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
//           <Link href="/" className="text-2xl font-bold">u8u<span className="text-primary">.ai</span></Link>
//           <div className="flex items-center gap-4">
//             <Link href="/sign-up"><Button>Sign Up</Button></Link>
//             <Link href="/sign-in"><Button variant="ghost">Sign In</Button></Link>
//           </div>
//         </nav>
//       </header>

//       <section className="py-20 text-center">
//         <div className="container mx-auto px-4">
//           <h1 className="text-5xl font-bold mb-6">AI Sales Agents That<br /><span className="text-primary">Never Sleep</span></h1>
//           <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Automate lead qualification, engagement, and meeting booking with AI agents that work 24/7.</p>
//           <div className="flex gap-4 justify-center">
//             <Link href="/sign-up"><Button size="lg" className='border-2'>Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
//             {/* <Link href="#pricing"><Button variant="outline" size="lg">View Pricing</Button></Link> */}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature) => (
//               <div key={feature.title} className="bg-white p-6 rounded-xl border">
//                 <feature.icon className="h-10 w-10 text-primary mb-4" />
//                 <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
//                 <p className="text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//       {/* Why Teams Choose u8u.ai */}
//       <section className="py-20">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold mb-3">
//               Why Teams Choose <span className="text-primary">u8u.ai</span>
//             </h2>
//             <p className="text-gray-500">A new standard for intelligent sales systems.</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse text-sm">
//               <thead>
//                 <tr>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Capability</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Automation</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">AI Tools</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">u8u.ai</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[
//                   ['Understands customer intent', '✕', '⚠', '✓ Intelligent AI'],
//                   ['Real-time decision making', 'Rule-based', 'Basic', '✓ Dynamic AI'],
//                   ['Handles objections', '✕', 'Weak', '✓ Human-like'],
//                   ['Guides buying decision', '✕', 'Partial', '✓ Smart guidance'],
//                   ['Closes deals', '✕', '✕', '✓ Revenue-focused'],
//                   ['Multi-channel support', '✕', 'Partial', '✓ Full coverage'],
//                   ['Complete system', '✕', '✕', '✓ End-to-End'],
//                   ['Lead auto-qualification', 'Partial', 'Weak', '✓ BANT scoring'],
//                   ['Voice AI calling', '✕', '✕', '✓ Native support'],
//                   ['Works 24/7 autonomously', '✕', 'Partial', '✓ Always on'],
//                 ].map(([capability, auto, aiTools, u8u], i) => (
//                   <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                     <td className="px-6 py-3 text-gray-700 border-b text-center">{capability}</td>
//                     <td className="px-6 py-3 text-center border-b">
//                       <span className={auto === '✕' ? 'text-red-500' : auto === '⚠' ? 'text-yellow-500' : 'text-yellow-600 text-l font-medium'}>{auto}</span>
//                     </td>
//                     <td className="px-6 py-3 text-center border-b">
//                       <span className={aiTools === '✕' ? 'text-red-500' : 'text-yellow-600 text-l font-medium'}>{aiTools}</span>
//                     </td>
//                     <td className="px-6 py-3 text-center  border-b ">
//                       <span className="text-violet-600 text-l font-bold">{u8u}</span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//       <footer className="border-t py-8 text-center text-gray-500">
//         <p>© {new Date().getFullYear()} Fuelo Technologies (OPC) Private Limited. Built for Startups.</p>
//       </footer>

//     </div>
//   );
// }