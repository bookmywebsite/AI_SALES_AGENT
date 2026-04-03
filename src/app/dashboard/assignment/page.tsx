'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Play, RefreshCw, CheckCircle, Zap, Calendar } from 'lucide-react';

interface Lead { id: string; email: string; firstName?: string | null; lastName?: string | null; phone?: string | null; status: string; }
interface TeamMember { id: string; isAvailable: boolean; currentLeadCount: number; maxLeadsPerDay: number; totalAssigned: number; languages: string[]; user: { firstName?: string | null; lastName?: string | null; email: string; }; }
interface ScheduledJob { id: string; jobType: string; targetId: string; scheduledFor: string; status: string; attempts: number; }

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  PROCESSING: { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc' },
  COMPLETED:  { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  FAILED:     { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
};

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '20px', padding: '20px',
} as React.CSSProperties;

export default function AssignmentPage() {
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [team, setTeam]     = useState<TeamMember[]>([]);
  const [jobs, setJobs]     = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog]       = useState<string[]>([]);

  useEffect(() => { fetchAll(); }, []);

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString('en-IN')}] ${msg}`, ...prev.slice(0, 19)]);
  }

  async function fetchAll() { await Promise.all([fetchLeads(), fetchTeam(), fetchJobs()]); }
  async function fetchLeads() { const r = await fetch('/api/leads').catch(() => null); const d = await r?.json().catch(() => null); setLeads(d?.leads ?? []); }
  async function fetchTeam()  { const r = await fetch('/api/team').catch(() => null);  const d = await r?.json().catch(() => null); setTeam(d?.members ?? []); }
  async function fetchJobs()  { const r = await fetch('/api/scheduler').catch(() => null); const d = await r?.json().catch(() => null); setJobs(d?.jobs ?? []); }

  async function handleAddSelf() {
    setLoading(true);
    const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_self', languages: ['EN', 'KN', 'HI'] }) });
    const d   = await res.json();
    addLog(d.success ? `✅ Added as team member (ID: ${d.member.id.slice(0, 8)}...)` : `❌ ${d.error}`);
    fetchTeam(); setLoading(false);
  }

  async function handleBulkAssign() {
    const unassigned = leads.filter(l => l.status === 'NEW' || l.status === 'CONTACTED');
    if (!unassigned.length) { addLog('⚠️ No unassigned leads found'); return; }
    setLoading(true);
    const res = await fetch('/api/assignment/assign', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadIds: unassigned.map(l => l.id) }) });
    const d   = await res.json();
    addLog(`✅ Bulk assign: ${d.assigned} assigned, ${d.failed} failed`);
    fetchLeads(); setLoading(false);
  }

  async function handleBulkFollowUp() {
    setLoading(true);
    const res = await fetch('/api/scheduler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bulk_follow_up' }) });
    const d   = await res.json();
    addLog(d.success ? `✅ Scheduled ${d.scheduled} follow-up calls` : `❌ ${d.error}`);
    fetchJobs(); setLoading(false);
  }

  async function handleProcessJobs() {
    setLoading(true);
    const res = await fetch('/api/scheduler/process', { method: 'POST' });
    const d   = await res.json();
    addLog(`✅ Processed: ${d.processed} jobs, failed: ${d.failed}`);
    fetchJobs(); setLoading(false);
  }

  async function handleAssignLead(leadId: string) {
    setLoading(true);
    const res = await fetch('/api/assignment/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }) });
    const d   = await res.json();
    addLog(d.success ? `✅ Lead assigned — ${d.reason}` : `⚠️ ${d.reason}`);
    fetchLeads(); setLoading(false);
  }

  async function handleToggleAvailability(memberId: string, current: boolean) {
    const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_availability', memberId, isAvailable: !current }) });
    const d   = await res.json();
    if (d.success) { addLog(`✅ Availability set to ${!current ? 'Available' : 'Unavailable'}`); fetchTeam(); }
  }

  const actionBtns = [
    { label: 'Add Me as Team Member', icon: Users,    color: '#6366f1', handler: handleAddSelf },
    { label: 'Auto-Assign All Leads', icon: Zap,      color: '#3b82f6', handler: handleBulkAssign },
    { label: 'Schedule Follow-ups',   icon: Calendar, color: '#f59e0b', handler: handleBulkFollowUp },
    { label: 'Process Jobs Now',      icon: Play,     color: '#10b981', handler: handleProcessJobs },
  ];

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Assignment & Scheduler</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Test lead auto-assignment and 24/7 scheduling</p>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {actionBtns.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.handler}
            disabled={loading}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              padding: '18px 12px', borderRadius: '16px', cursor: 'pointer',
              background: `${btn.color}18`, border: `1px solid ${btn.color}35`,
              color: '#fff', fontSize: '13px', fontWeight: 500,
              opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            <btn.icon size={20} style={{ color: btn.color }} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Four panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Team Members */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              <Users size={15} style={{ color: '#818cf8' }} />
              Team Members ({team.length})
            </div>
            <button onClick={fetchTeam} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          {team.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)' }}>
              <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: '13px' }}>No team members yet</p>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>Click &ldquo;Add Me as Team Member&rdquo; above</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {team.map((member) => (
                <div key={member.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', margin: 0 }}>
                      {member.user.firstName ?? ''} {member.user.lastName ?? member.user.email}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                      {member.currentLeadCount}/{member.maxLeadsPerDay} leads · {member.totalAssigned} total · {member.languages.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAvailability(member.id, member.isAvailable)}
                    style={{
                      fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '100px', cursor: 'pointer', border: 'none',
                      background: member.isAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
                      color: member.isAvailable ? '#6ee7b7' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {member.isAvailable ? '🟢 Available' : '⚪ Unavailable'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Jobs */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              <Clock size={15} style={{ color: '#f59e0b' }} />
              Scheduled Jobs ({jobs.length})
            </div>
            <button onClick={fetchJobs} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)' }}>
              <Clock size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: '13px' }}>No pending jobs</p>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>Click &ldquo;Schedule Follow-ups&rdquo; to create jobs</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', margin: 0 }}>{job.jobType}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                      {new Date(job.scheduledFor).toLocaleString('en-IN')} · Attempt {job.attempts}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px', background: STATUS_COLOR[job.status]?.bg ?? 'rgba(255,255,255,0.07)', color: STATUS_COLOR[job.status]?.text ?? 'rgba(255,255,255,0.4)' }}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads — Assign Individually */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              <Zap size={15} style={{ color: '#3b82f6' }} />
              Leads — Assign Individually ({leads.length})
            </div>
            <button onClick={fetchLeads} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          {leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No leads found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
              {leads.slice(0, 20).map((lead) => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', margin: 0 }}>{lead.firstName ?? lead.email}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{lead.status} · {lead.phone ?? 'no phone'}</p>
                  </div>
                  <button
                    onClick={() => handleAssignLead(lead.id)}
                    disabled={loading}
                    style={{ fontSize: '11px', fontWeight: 500, padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'rgba(59,130,246,0.2)', color: '#93c5fd', opacity: loading ? 0.5 : 1 }}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
            <CheckCircle size={15} style={{ color: '#10b981' }} />
            Activity Log
          </div>
          {log.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
              No activity yet — run an action above
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto', fontFamily: 'monospace' }}>
              {log.map((entry, i) => (
                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '7px 10px', margin: 0 }}>
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// 'use client';

// import { useState, useEffect } from 'react';
// import { Users, Clock, Play, RefreshCw, CheckCircle, XCircle, Loader2, Zap, Calendar } from 'lucide-react';

// interface Lead {
//   id: string;
//   email: string;
//   firstName?: string | null;
//   lastName?: string | null;
//   phone?: string | null;
//   status: string;
// }

// interface TeamMember {
//   id: string;
//   isAvailable: boolean;
//   currentLeadCount: number;
//   maxLeadsPerDay: number;
//   totalAssigned: number;
//   languages: string[];
//   user: {
//     firstName?: string | null;
//     lastName?: string | null;
//     email: string;
//   };
// }

// interface ScheduledJob {
//   id: string;
//   jobType: string;
//   targetId: string;
//   scheduledFor: string;
//   status: string;
//   attempts: number;
// }

// export default function AssignmentTestPage() {
//   const [leads, setLeads]           = useState<Lead[]>([]);
//   const [team, setTeam]             = useState<TeamMember[]>([]);
//   const [jobs, setJobs]             = useState<ScheduledJob[]>([]);
//   const [loading, setLoading]       = useState(false);
//   const [log, setLog]               = useState<string[]>([]);

//   useEffect(() => {
//     fetchAll();
//   }, []);

//   function addLog(msg: string) {
//     setLog((prev) => [`[${new Date().toLocaleTimeString('en-IN')}] ${msg}`, ...prev.slice(0, 19)]);
//   }

//   async function fetchAll() {
//     await Promise.all([fetchLeads(), fetchTeam(), fetchJobs()]);
//   }

//   async function fetchLeads() {
//     const res  = await fetch('/api/leads').catch(() => null);
//     const data = await res?.json().catch(() => null);
//     setLeads(data?.leads ?? []);
//   }

//   async function fetchTeam() {
//     const res  = await fetch('/api/team').catch(() => null);
//     const data = await res?.json().catch(() => null);
//     setTeam(data?.members ?? []);
//   }

//   async function fetchJobs() {
//     const res  = await fetch('/api/scheduler').catch(() => null);
//     const data = await res?.json().catch(() => null);
//     setJobs(data?.jobs ?? []);
//   }

//   // ── Add yourself as team member ───────────────────────────────────────────
//   async function handleAddSelf() {
//     setLoading(true);
//     try {
//       const res  = await fetch('/api/team', {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({ action: 'add_self', languages: ['EN', 'KN', 'HI'] }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         addLog(`✅ Added as team member (ID: ${data.member.id.slice(0, 8)}...)`);
//         fetchTeam();
//       } else {
//         addLog(`❌ ${data.error}`);
//       }
//     } catch {
//       addLog('❌ Failed to add team member');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ── Auto-assign all unassigned leads ─────────────────────────────────────
//   async function handleBulkAssign() {
//     const unassigned = leads.filter((l) => l.status === 'NEW' || l.status === 'CONTACTED');
//     if (unassigned.length === 0) {
//       addLog('⚠️ No unassigned leads found');
//       return;
//     }
//     setLoading(true);
//     try {
//       const res  = await fetch('/api/assignment/assign', {
//         method:  'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({ leadIds: unassigned.map((l) => l.id) }),
//       });
//       const data = await res.json();
//       addLog(`✅ Bulk assign: ${data.assigned} assigned, ${data.failed} failed`);
//       fetchLeads();
//     } catch {
//       addLog('❌ Bulk assign failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ── Assign single lead ────────────────────────────────────────────────────
//   async function handleAssignLead(leadId: string) {
//     setLoading(true);
//     try {
//       const res  = await fetch('/api/assignment/assign', {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({ leadId }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         addLog(`✅ Lead assigned — ${data.reason}`);
//         fetchLeads();
//       } else {
//         addLog(`⚠️ ${data.reason}`);
//       }
//     } catch {
//       addLog('❌ Assignment failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ── Schedule bulk follow-ups ──────────────────────────────────────────────
//   async function handleBulkFollowUp() {
//     setLoading(true);
//     try {
//       const res  = await fetch('/api/scheduler', {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({ action: 'bulk_follow_up' }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         addLog(`✅ Scheduled ${data.scheduled} follow-up calls`);
//         fetchJobs();
//       } else {
//         addLog(`❌ ${data.error}`);
//       }
//     } catch {
//       addLog('❌ Scheduling failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ── Process pending jobs now ──────────────────────────────────────────────
//   async function handleProcessJobs() {
//     setLoading(true);
//     try {
//       const res  = await fetch('/api/scheduler/process', { method: 'POST' });
//       const data = await res.json();
//       addLog(`✅ Processed: ${data.processed} jobs, failed: ${data.failed}`);
//       fetchJobs();
//     } catch {
//       addLog('❌ Processing failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // ── Toggle team member availability ──────────────────────────────────────
//   async function handleToggleAvailability(memberId: string, current: boolean) {
//     const res  = await fetch('/api/team', {
//       method:  'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body:    JSON.stringify({ action: 'toggle_availability', memberId, isAvailable: !current }),
//     });
//     const data = await res.json();
//     if (data.success) {
//       addLog(`✅ Availability set to ${!current ? 'Available' : 'Unavailable'}`);
//       fetchTeam();
//     }
//   }

//   const statusColor: Record<string, string> = {
//     PENDING:    'bg-yellow-100 text-yellow-700',
//     PROCESSING: 'bg-blue-100 text-blue-700',
//     COMPLETED:  'bg-green-100 text-green-700',
//     FAILED:     'bg-red-100 text-red-700',
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold">Assignment & Scheduler</h1>
//         <p className="text-gray-500 mt-1">Test lead auto-assignment and 24/7 scheduling</p>
//       </div>

//       {/* Action Buttons */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <button
//           onClick={handleAddSelf}
//           disabled={loading}
//           className="flex flex-col items-center gap-2 bg-violet-600 text-white rounded-2xl p-4 hover:bg-violet-700 disabled:opacity-50 transition-colors"
//         >
//           <Users className="w-6 h-6" />
//           <span className="text-sm font-medium">Add Me as Team Member</span>
//         </button>

//         <button
//           onClick={handleBulkAssign}
//           disabled={loading}
//           className="flex flex-col items-center gap-2 bg-blue-600 text-white rounded-2xl p-4 hover:bg-blue-700 disabled:opacity-50 transition-colors"
//         >
//           <Zap className="w-6 h-6" />
//           <span className="text-sm font-medium">Auto-Assign All Leads</span>
//         </button>

//         <button
//           onClick={handleBulkFollowUp}
//           disabled={loading}
//           className="flex flex-col items-center gap-2 bg-orange-500 text-white rounded-2xl p-4 hover:bg-orange-600 disabled:opacity-50 transition-colors"
//         >
//           <Calendar className="w-6 h-6" />
//           <span className="text-sm font-medium">Schedule Follow-ups</span>
//         </button>

//         <button
//           onClick={handleProcessJobs}
//           disabled={loading}
//           className="flex flex-col items-center gap-2 bg-green-600 text-white rounded-2xl p-4 hover:bg-green-700 disabled:opacity-50 transition-colors"
//         >
//           <Play className="w-6 h-6" />
//           <span className="text-sm font-medium">Process Jobs Now</span>
//         </button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//         {/* Team Members */}
//         <div className="bg-white rounded-2xl border border-gray-200 p-5">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-semibold text-gray-900 flex items-center gap-2">
//               <Users className="w-4 h-4 text-violet-600" />
//               Team Members ({team.length})
//             </h2>
//             <button onClick={fetchTeam} className="text-gray-400 hover:text-gray-600">
//               <RefreshCw className="w-4 h-4" />
//             </button>
//           </div>

//           {team.length === 0 ? (
//             <div className="text-center py-8 text-gray-400">
//               <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
//               <p className="text-sm">No team members yet</p>
//               <p className="text-xs mt-1">Click "Add Me as Team Member" above</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {team.map((member) => (
//                 <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
//                   <div>
//                     <p className="font-medium text-sm text-gray-900">
//                       {member.user.firstName ?? ''} {member.user.lastName ?? member.user.email}
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       {member.currentLeadCount}/{member.maxLeadsPerDay} leads · {member.totalAssigned} total · {member.languages.join(', ')}
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => handleToggleAvailability(member.id, member.isAvailable)}
//                     className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
//                       member.isAvailable
//                         ? 'bg-green-100 text-green-700 hover:bg-green-200'
//                         : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
//                     }`}
//                   >
//                     {member.isAvailable ? '🟢 Available' : '⚪ Unavailable'}
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Scheduled Jobs */}
//         <div className="bg-white rounded-2xl border border-gray-200 p-5">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-semibold text-gray-900 flex items-center gap-2">
//               <Clock className="w-4 h-4 text-orange-500" />
//               Scheduled Jobs ({jobs.length})
//             </h2>
//             <button onClick={fetchJobs} className="text-gray-400 hover:text-gray-600">
//               <RefreshCw className="w-4 h-4" />
//             </button>
//           </div>

//           {jobs.length === 0 ? (
//             <div className="text-center py-8 text-gray-400">
//               <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
//               <p className="text-sm">No pending jobs</p>
//               <p className="text-xs mt-1">Click "Schedule Follow-ups" to create jobs</p>
//             </div>
//           ) : (
//             <div className="space-y-2 max-h-64 overflow-y-auto">
//               {jobs.map((job) => (
//                 <div key={job.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
//                   <div>
//                     <p className="font-medium text-sm text-gray-900">{job.jobType}</p>
//                     <p className="text-xs text-gray-500">
//                       {new Date(job.scheduledFor).toLocaleString('en-IN')} · Attempt {job.attempts}
//                     </p>
//                   </div>
//                   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
//                     {job.status}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Leads with Assignment */}
//         <div className="bg-white rounded-2xl border border-gray-200 p-5">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-semibold text-gray-900 flex items-center gap-2">
//               <Zap className="w-4 h-4 text-blue-600" />
//               Leads — Assign Individually ({leads.length})
//             </h2>
//             <button onClick={fetchLeads} className="text-gray-400 hover:text-gray-600">
//               <RefreshCw className="w-4 h-4" />
//             </button>
//           </div>

//           {leads.length === 0 ? (
//             <div className="text-center py-8 text-gray-400">
//               <p className="text-sm">No leads found</p>
//             </div>
//           ) : (
//             <div className="space-y-2 max-h-64 overflow-y-auto">
//               {leads.slice(0, 20).map((lead) => (
//                 <div key={lead.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
//                   <div>
//                     <p className="font-medium text-sm text-gray-900">
//                       {lead.firstName ?? lead.email}
//                     </p>
//                     <p className="text-xs text-gray-500">{lead.status} · {lead.phone ?? 'no phone'}</p>
//                   </div>
//                   <button
//                     onClick={() => handleAssignLead(lead.id)}
//                     disabled={loading}
//                     className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
//                   >
//                     Assign
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Activity Log */}
//         <div className="bg-white rounded-2xl border border-gray-200 p-5">
//           <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
//             <CheckCircle className="w-4 h-4 text-green-600" />
//             Activity Log
//           </h2>

//           {log.length === 0 ? (
//             <div className="text-center py-8 text-gray-400">
//               <p className="text-sm">No activity yet — run an action above</p>
//             </div>
//           ) : (
//             <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono">
//               {log.map((entry, i) => (
//                 <p key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
//                   {entry}
//                 </p>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }