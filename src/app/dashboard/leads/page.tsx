'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, X, Users, Phone, Mail } from 'lucide-react';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';

interface Lead {
  id: string; email: string; firstName?: string | null; lastName?: string | null;
  company?: string | null; phone?: string | null; score?: number | null;
  tier?: string | null; status: string; createdAt: string;
}

const TIER_COLOR:   Record<string, string> = { HOT: '#ef4444', WARM: '#f59e0b', COLD: '#6b7280' };
const STATUS_COLOR: Record<string, string> = {
  NEW: '#6366f1', CONTACTED: '#06b6d4', ENGAGED: '#8b5cf6',
  QUALIFIED: '#10b981', MEETING_SET: '#a855f7', WON: '#10b981', LOST: '#6b7280',
};

const LANGUAGES = [
  { code: 'EN', label: 'English' }, { code: 'HI', label: 'Hindi' },
  { code: 'TA', label: 'Tamil' },  { code: 'TE', label: 'Telugu' },
  { code: 'KN', label: 'Kannada' },{ code: 'ML', label: 'Malayalam' },
  { code: 'MR', label: 'Marathi' },{ code: 'BN', label: 'Bengali' },
  { code: 'GU', label: 'Gujarati' },{ code: 'PA', label: 'Punjabi' },
];

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '10px', fontSize: '13px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', outline: 'none', boxSizing: 'border-box',
};

// ── Add Lead Modal ──────────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');
  const [form,   setForm]     = useState({
    email: '', firstName: '', lastName: '', phone: '', company: '',
    jobTitle: '', source: 'manual', preferredLanguage: 'EN', notes: '',
  });

  function set(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
    setError('');
  }

  async function handleSubmit() {
    if (!form.email.trim())     { setError('Email is required');        return; }
    if (!form.firstName.trim()) { setError('First name is required');   return; }
    if (!form.lastName.trim())  { setError('Last name is required');    return; }
    if (!form.phone.trim())     { setError('Phone number is required'); return; }
    if (!form.company.trim())   { setError('Company is required');      return; }
    if (!form.jobTitle.trim())  { setError('Job title is required');    return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/leads/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { onCreated(); onClose(); }
      else setError(data.error ?? 'Failed to create lead');
    } catch { setError('Network error'); }
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '520px', maxHeight: '90vh',
        overflowY: 'auto', margin: '0 16px',
        background: '#111118', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '28px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Add New Lead</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>Fill in the lead details below</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Email — required */}
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>
              Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="lead@company.com" type="email" style={inp} />
          </div>

          {/* First + Last name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Rajesh" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Kumar" style={inp} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" style={inp} />
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>Required for voice calls and WhatsApp</p>
          </div>

          {/* Company + Job Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Company <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Job Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="CEO" style={inp} />
            </div>
          </div>

          {/* Source + Language */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Source <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.source} onChange={e => set('source', e.target.value)} style={{
                width: '100%', padding: '10px 13px', borderRadius: '10px', fontSize: '13px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
              }}>
                <option value="manual"       style={{ background: '#111118', color: '#fff' }}>Manual Entry</option>
                <option value="website"      style={{ background: '#111118', color: '#fff' }}>Website</option>
                <option value="referral"     style={{ background: '#111118', color: '#fff' }}>Referral</option>
                <option value="linkedin"     style={{ background: '#111118', color: '#fff' }}>LinkedIn</option>
                <option value="cold_outreach"style={{ background: '#111118', color: '#fff' }}>Cold Outreach</option>
                <option value="event"        style={{ background: '#111118', color: '#fff' }}>Event</option>
                <option value="other"        style={{ background: '#111118', color: '#fff' }}>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Preferred Language <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value)} style={{
                width: '100%', padding: '10px 13px', borderRadius: '10px', fontSize: '13px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
              }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: '#111118', color: '#fff' }}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Notes — optional */}
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Notes <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>(optional)</span></label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional context about this lead..."
              rows={3}
              style={{ ...inp, resize: 'none' as const, lineHeight: '1.5' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '11px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Plus size={15} /> Add Lead</>}
            </button>
            <button
              onClick={onClose}
              style={{ padding: '11px 20px', borderRadius: '12px', fontSize: '14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Leads Page ────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads,       setLeads]      = useState<Lead[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [search,      setSearch]     = useState('');
  const [statusFilter,setStatus]     = useState('');
  const [agentId,     setAgentId]    = useState('');
  const [selected,    setSelected]   = useState<Lead | null>(null);
  const [showAdd,     setShowAdd]    = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res  = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    fetch('/api/agent/default').then(r => r.json()).then(d => setAgentId(d.agentId ?? '')).catch(() => {});
  }, []);

  const statuses = ['', 'NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'MEETING_SET', 'WON', 'LOST'];

  return (
    <div style={{ padding: '28px 32px', background: '#0a0a0f', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Leads</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{leads.length} total leads</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp, paddingLeft: '32px', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              background: statusFilter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
              borderColor: statusFilter === s ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)',
              color: statusFilter === s ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
            }}>{s || 'All'}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 110px', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Lead', 'Company', 'Tier', 'Status', 'Score', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Loading...</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', margin: '0 0 8px' }}>No leads found</p>
            <button onClick={() => setShowAdd(true)} style={{ fontSize: '13px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Add your first lead →
            </button>
          </div>
        ) : leads.map((lead, i) => {
          const initials = (lead.firstName?.[0] ?? lead.email[0]).toUpperCase();
          return (
            <div key={lead.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 110px',
              alignItems: 'center', padding: '11px 20px',
              borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#818cf8' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                    {lead.firstName ?? ''} {lead.lastName ?? ''}
                    {!lead.firstName && !lead.lastName && <span style={{ color: 'rgba(255,255,255,0.3)' }}>Anonymous</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>{lead.email}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{lead.company ?? '—'}</div>
              <div>
                {lead.tier && <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px', background: `${TIER_COLOR[lead.tier]}18`, color: TIER_COLOR[lead.tier] }}>{lead.tier}</span>}
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '100px', background: `${STATUS_COLOR[lead.status] ?? '#6366f1'}18`, color: STATUS_COLOR[lead.status] ?? '#6366f1' }}>
                  {lead.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{lead.score != null ? `${lead.score}/100` : '—'}</div>
              <div>
                <button
                  onClick={() => setSelected(lead)}
                  style={{
                    padding: '6px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc', cursor: 'pointer',
                  }}
                >⚡ Actions</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      {selected && agentId && (
        <QuickActionsPanel lead={selected} agentId={agentId} onClose={() => setSelected(null)} />
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchLeads}
        />
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}


// 'use client';

// import { useState, useEffect } from 'react';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Plus, Zap, Phone, Mail, Search } from 'lucide-react';
// import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';

// interface Lead {
//   id: string;
//   email: string;
//   firstName?: string | null;
//   lastName?: string | null;
//   company?: string | null;
//   phone?: string | null;
//   score?: number | null;
//   tier?: string | null;
//   status: string;
//   createdAt: string;
// }

// export default function LeadsPage() {
//   const [leads, setLeads]               = useState<Lead[]>([]);
//   const [loading, setLoading]           = useState(true);
//   const [search, setSearch]             = useState('');
//   const [tierFilter, setTierFilter]     = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
//   const [agentId, setAgentId]           = useState('');

//   useEffect(() => {
//     fetchLeads();
//     fetchAgent();
//   }, [tierFilter, statusFilter]);

//   async function fetchLeads() {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (tierFilter)   params.set('tier',   tierFilter);
//       if (statusFilter) params.set('status', statusFilter);
//       const res  = await fetch(`/api/leads?${params}`);
//       const data = await res.json();
//       setLeads(data.leads ?? []);
//     } catch {}
//     finally { setLoading(false); }
//   }

//   async function fetchAgent() {
//     try {
//       const res  = await fetch('/api/agent/default');
//       const data = await res.json();
//       if (data.agentId) setAgentId(data.agentId);
//     } catch {}
//   }

//   const filtered = leads.filter((l) => {
//     if (!search) return true;
//     const q = search.toLowerCase();
//     return (
//       l.email.toLowerCase().includes(q) ||
//       l.firstName?.toLowerCase().includes(q) ||
//       l.lastName?.toLowerCase().includes(q) ||
//       l.company?.toLowerCase().includes(q)
//     );
//   });

//   const tierFilters   = ['HOT', 'WARM', 'COLD'];
//   const statusFilters = ['NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'MEETING_SET', 'WON', 'LOST'];

//   const tierColor: Record<string, string> = {
//     HOT:  'bg-red-100 text-red-700 border-red-200',
//     WARM: 'bg-orange-100 text-orange-700 border-orange-200',
//     COLD: 'bg-blue-100 text-blue-700 border-blue-200',
//   };

//   const statusColor: Record<string, string> = {
//     NEW:         'bg-gray-100 text-gray-600',
//     CONTACTED:   'bg-blue-100 text-blue-700',
//     ENGAGED:     'bg-indigo-100 text-indigo-700',
//     QUALIFIED:   'bg-green-100 text-green-700',
//     MEETING_SET: 'bg-purple-100 text-purple-700',
//     WON:         'bg-emerald-100 text-emerald-700',
//     LOST:        'bg-red-100 text-red-600',
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Leads</h1>
//           <p className="text-muted-foreground">{filtered.length} leads found</p>
//         </div>
//         <Button>
//           <Plus className="w-4 h-4 mr-2" />
//           Add Lead
//         </Button>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//         <input
//           type="text"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by name, email, company..."
//           className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
//         />
//       </div>

//       {/* Tier filters */}
//       <div className="flex flex-wrap gap-2">
//         <span className="text-sm text-muted-foreground self-center">Tier:</span>
//         <button
//           onClick={() => setTierFilter('')}
//           className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
//             !tierFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
//           }`}
//         >
//           All
//         </button>
//         {tierFilters.map((tier) => (
//           <button
//             key={tier}
//             onClick={() => setTierFilter(tierFilter === tier ? '' : tier)}
//             className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
//               tierFilter === tier
//                 ? tierColor[tier]
//                 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
//             }`}
//           >
//             {tier === 'HOT' ? '🔥' : tier === 'WARM' ? '🌤️' : '❄️'} {tier}
//           </button>
//         ))}
//       </div>

//       {/* Status filters */}
//       <div className="flex flex-wrap gap-2">
//         <span className="text-sm text-muted-foreground self-center">Status:</span>
//         <button
//           onClick={() => setStatusFilter('')}
//           className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
//             !statusFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
//           }`}
//         >
//           All
//         </button>
//         {statusFilters.map((status) => (
//           <button
//             key={status}
//             onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
//             className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
//               statusFilter === status
//                 ? statusColor[status]
//                 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
//             }`}
//           >
//             {status}
//           </button>
//         ))}
//       </div>

//       {/* Table */}
//       {loading ? (
//         <div className="flex items-center justify-center h-40">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
//           <p className="text-gray-500">No leads found</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
//           <table className="w-full">
//             <thead className="border-b bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {filtered.map((lead) => (
//                 <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-3">
//                     <div>
//                       <p className="font-medium text-gray-900 text-sm">
//                         {lead.firstName ?? ''} {lead.lastName ?? ''}
//                         {!lead.firstName && !lead.lastName && 'Anonymous'}
//                       </p>
//                       <p className="text-xs text-gray-500">{lead.email}</p>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3 text-sm text-gray-600">
//                     {lead.company ?? '—'}
//                   </td>
//                   <td className="px-4 py-3">
//                     {lead.score != null ? (
//                       <div className="flex items-center gap-2">
//                         <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
//                           <div
//                             className="h-full rounded-full bg-violet-500"
//                             style={{ width: `${lead.score}%` }}
//                           />
//                         </div>
//                         <span className="text-xs text-gray-600">{lead.score}</span>
//                       </div>
//                     ) : (
//                       <span className="text-xs text-gray-400">—</span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3">
//                     {lead.tier ? (
//                       <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tierColor[lead.tier]}`}>
//                         {lead.tier === 'HOT' ? '🔥' : lead.tier === 'WARM' ? '🌤️' : '❄️'} {lead.tier}
//                       </span>
//                     ) : <span className="text-xs text-gray-400">—</span>}
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[lead.status]}`}>
//                       {lead.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-1">
//                       <button
//                         onClick={() => setSelectedLead(lead)}
//                         className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
//                       >
//                         <Zap className="w-3 h-3" />
//                         Actions
//                       </button>
//                       <button
//                         onClick={() => { setSelectedLead(lead); }}
//                         className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                         title="Call"
//                       >
//                         <Phone className="w-3.5 h-3.5" />
//                       </button>
//                       <button
//                         onClick={() => { setSelectedLead(lead); }}
//                         className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="Email"
//                       >
//                         <Mail className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Quick Actions Panel */}
//       {selectedLead && (
//         <QuickActionsPanel
//           lead={selectedLead}
//           agentId={agentId}
//           onClose={() => setSelectedLead(null)}
//         />
//       )}
//     </div>
//   );
// }