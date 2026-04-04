import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
    Users, Phone, MessageSquare, Calendar,
    TrendingUp, Mail, Zap, Bot, ArrowUpRight,
    PhoneCall, Target, Activity, Clock,
} from 'lucide-react';

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
    label, value, sub, icon: Icon, accent, trend,
}: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; accent: string; trend?: string;
}) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* accent glow */}
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: `${accent}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={18} style={{ color: accent }} />
                </div>
                {trend && (
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        fontSize: '12px', fontWeight: 500, color: '#10b981',
                    }}>
                        <ArrowUpRight size={12} />
                        {trend}
                    </span>
                )}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '6px' }}>{label}</div>
            {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{sub}</div>}
        </div>
    );
}

// ── Lead Row ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, index }: { lead: any; index: number }) {
    const tierColors: Record<string, string> = {
        HOT: '#ef4444', WARM: '#f59e0b', COLD: '#6b7280',
    };
    const statusColors: Record<string, string> = {
        NEW: '#6366f1', CONTACTED: '#06b6d4', ENGAGED: '#8b5cf6',
        QUALIFIED: '#10b981', MEETING_SET: '#a855f7', WON: '#10b981', LOST: '#6b7280',
    };
    const tier = lead.tier ?? 'COLD';
    const status = lead.status ?? 'NEW';
    const initials = lead.firstName?.[0] ?? lead.email[0].toUpperCase();

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
            alignItems: 'center', padding: '12px 16px',
            borderBottom: index < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(99,102,241,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 600, color: '#818cf8',
                }}>{initials}</div>
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                        {lead.firstName ?? ''} {lead.lastName ?? ''}
                        {!lead.firstName && !lead.lastName && <span style={{ color: 'rgba(255,255,255,0.3)' }}>Anonymous</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{lead.email}</div>
                </div>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{lead.company ?? '—'}</div>
            <div>
                <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px',
                    background: `${tierColors[tier]}18`, color: tierColors[tier],
                }}>{tier}</span>
            </div>
            <div>
                <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px',
                    background: `${statusColors[status]}18`, color: statusColors[status],
                }}>{status}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {lead.score != null ? `${lead.score}/100` : '—'}
            </div>
        </div>
    );
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ activity }: { activity: any }) {
    const icons: Record<string, React.ElementType> = {
        VOICE: PhoneCall, EMAIL: Mail, CHAT: MessageSquare,
    };
    const colors: Record<string, string> = {
        VOICE: '#10b981', EMAIL: '#6366f1', CHAT: '#a855f7',
    };
    const channel = activity.channel ?? 'CHAT';
    const Icon = icons[channel] ?? MessageSquare;
    const color = colors[channel] ?? '#a855f7';
    const lead = activity.lead;
    const name = lead?.firstName ?? lead?.email?.split('@')[0] ?? 'Unknown';

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: `${color}18`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={14} style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>{name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    {channel} · {activity.status}
                </div>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                {new Date(activity.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
    const clerkUser = await currentUser();
    if (!clerkUser) redirect('/sign-in');

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
    if (!user?.organizationId) redirect('/sign-in');

    const orgId = user.organizationId;

    // Sequential queries — pgBouncer safe
    const totalLeads = await prisma.lead.count({ where: { organizationId: orgId } });
    const hotLeads = await prisma.lead.count({ where: { organizationId: orgId, tier: 'HOT' } });
    const warmLeads = await prisma.lead.count({ where: { organizationId: orgId, tier: 'WARM' } });
    const totalConversations = await prisma.conversation.count({ where: { organizationId: orgId } });
    const voiceCalls = await prisma.conversation.count({ where: { organizationId: orgId, channel: 'VOICE' } });
    const emailConvs = await prisma.conversation.count({ where: { organizationId: orgId, channel: 'EMAIL' } });
    const meetingsBooked = await prisma.meeting.count({ where: { organizationId: orgId } });
    const qualifiedLeads = await prisma.lead.count({ where: { organizationId: orgId, status: 'QUALIFIED' } });
    const newLeads = await prisma.lead.count({ where: { organizationId: orgId, status: 'NEW' } });
    const wonLeads = await prisma.lead.count({ where: { organizationId: orgId, status: 'WON' } });

    const recentLeads = await prisma.lead.findMany({
        where: { organizationId: orgId, email: { not: { contains: 'anonymous' } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    const recentConversations = await prisma.conversation.findMany({
        where: { organizationId: orgId },
        orderBy: { startedAt: 'desc' },
        take: 6,
        include: { lead: { select: { firstName: true, lastName: true, email: true } } },
    });

    const scheduledJobs = await (prisma as any).scheduledJob.count({
        where: { status: 'PENDING' },
    }).catch(() => 0);

    const convRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const contactRate = totalLeads > 0 ? (((totalLeads - newLeads) / totalLeads) * 100).toFixed(0) : '0';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>

            {/* ambient orbs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, padding: '32px' }}>

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
                            Dashboard
                        </h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                            Welcome back, {clerkUser.firstName ?? 'there'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* live indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '7px 14px', borderRadius: '100px',
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                            fontSize: '12px', fontWeight: 500, color: '#10b981',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
                            Live
                        </div>
                        {/* <Link href="/dashboard/leads">
                            <button style={{
                                padding: '8px 18px', borderRadius: '12px', fontSize: '13px',
                                fontWeight: 500, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                color: '#fff', border: 'none', cursor: 'pointer',
                            }}>+ Add Lead</button>
                        </Link> */}
                    </div>
                </div>

                {/* ── Stats Grid ──────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '28px' }}>
                    <StatCard label="Total Leads" value={totalLeads} icon={Users} accent="#6366f1" trend="+today" />
                    <StatCard label="Hot Leads" value={hotLeads} icon={Zap} accent="#ef4444" sub={`${warmLeads} warm`} />
                    <StatCard label="Conversations" value={totalConversations} icon={MessageSquare} accent="#8b5cf6" sub={`${voiceCalls} calls · ${emailConvs} emails`} />
                    <StatCard label="Meetings Booked" value={meetingsBooked} icon={Calendar} accent="#a855f7" />
                    <StatCard label="Qualified Leads" value={qualifiedLeads} icon={Target} accent="#10b981" sub={`${convRate}% conv. rate`} />
                    <StatCard label="Pending Calls" value={scheduledJobs} icon={Clock} accent="#f59e0b" sub="scheduled jobs" />
                </div>

                {/* ── Pipeline Bar ─────────────────────────────────────────────── */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px', padding: '24px', marginBottom: '28px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>Sales Pipeline</h2>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{totalLeads} total leads</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
                        {[
                            { label: 'New', count: newLeads, color: '#6366f1' },
                            { label: 'Contacted', count: await prisma.lead.count({ where: { organizationId: orgId, status: 'CONTACTED' } }), color: '#06b6d4' },
                            { label: 'Qualified', count: qualifiedLeads, color: '#10b981' },
                            { label: 'Meeting Set', count: await prisma.lead.count({ where: { organizationId: orgId, status: 'MEETING_SET' } }), color: '#a855f7' },
                            { label: 'Won', count: wonLeads, color: '#f59e0b' },
                        ].map((stage) => {
                            const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
                            return (
                                <div key={stage.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{stage.label}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{stage.count}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: '100px', transition: 'width 0.6s ease' }} />
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Two columns ────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', marginBottom: '28px' }}>

                    {/* Recent Leads */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '20px', overflow: 'hidden',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Recent Leads</h2>
                            <Link href="/dashboard/leads" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
                        </div>

                        {/* Table header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                            padding: '12px 16px', marginTop: '12px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {['Lead', 'Company', 'Tier', 'Status', 'Score'].map((h) => (
                                <span key={h} style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                            ))}
                        </div>

                        {recentLeads.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                                No leads yet — add your first lead
                            </div>
                        ) : (
                            recentLeads.map((lead, i) => <LeadRow key={lead.id} lead={lead} index={i} />)
                        )}
                    </div>

                    {/* Activity + Quick Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Quick Actions */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '20px', padding: '20px',
                        }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px' }}>Quick Actions</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[
                                    { label: 'Leads', href: '/dashboard/leads', icon: Users, color: '#6366f1' },
                                    { label: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare, color: '#8b5cf6' },
                                    { label: 'Assignment', href: '/dashboard/assignment', icon: Target, color: '#10b981' },
                                    { label: 'Sequences', href: '/dashboard/sequences', icon: Mail, color: '#f59e0b' },
                                    { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp, color: '#06b6d4' },
                                    { label: 'Settings', href: '/dashboard/settings', icon: Zap, color: '#a855f7' },
                                ].map((item) => (
                                    <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 12px', borderRadius: '12px',
                                            background: `${item.color}10`, border: `1px solid ${item.color}20`,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}>
                                            <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '20px', padding: '20px',
                            flex: 1,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Recent Activity</h2>
                                <Link href="/dashboard/conversations" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none' }}>View all →</Link>
                            </div>
                            {recentConversations.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No activity yet</div>
                            ) : (
                                recentConversations.map((conv) => <ActivityItem key={conv.id} activity={conv} />)
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Bottom Metrics Row ──────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>

                    {/* Contact rate */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '20px', padding: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Activity size={16} style={{ color: '#06b6d4' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Engagement</h3>
                        </div>
                        {[
                            { label: 'Contact Rate', value: `${contactRate}%`, color: '#6366f1' },
                            { label: 'Qualified Rate', value: totalLeads > 0 ? `${((qualifiedLeads / totalLeads) * 100).toFixed(0)}%` : '0%', color: '#10b981' },
                            { label: 'Conversion Rate', value: `${convRate}%`, color: '#f59e0b' },
                        ].map((m) => (
                            <div key={m.label} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{m.value}</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: m.value, background: m.color, borderRadius: '100px' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Channel breakdown */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '20px', padding: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Bot size={16} style={{ color: '#8b5cf6' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Channels</h3>
                        </div>
                        {[
                            { label: 'Voice Calls', value: voiceCalls, icon: Phone, color: '#10b981' },
                            { label: 'Email', value: emailConvs, icon: Mail, color: '#6366f1' },
                            { label: 'Chat', value: Math.max(0, totalConversations - voiceCalls - emailConvs), icon: MessageSquare, color: '#a855f7' },
                        ].map((ch) => (
                            <div key={ch.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${ch.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ch.icon size={13} style={{ color: ch.color }} />
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{ch.label}</span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{ch.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Lead tiers */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '20px', padding: '24px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <TrendingUp size={16} style={{ color: '#f59e0b' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Lead Tiers</h3>
                        </div>
                        {[
                            { label: 'Hot', value: hotLeads, color: '#ef4444' },
                            { label: 'Warm', value: warmLeads, color: '#f59e0b' },
                            { label: 'Cold', value: totalLeads - hotLeads - warmLeads, color: '#6b7280' },
                        ].map((tier) => {
                            const pct = totalLeads > 0 ? Math.round((tier.value / totalLeads) * 100) : 0;
                            return (
                                <div key={tier.label} style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tier.color, display: 'inline-block' }} />
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{tier.label}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{tier.value} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span></span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: tier.color, borderRadius: '100px' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

