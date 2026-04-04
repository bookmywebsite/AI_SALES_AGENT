'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Users, CheckCircle, MessageSquare, Pause, Play, Loader2, ArrowRight, X, Trash2 } from 'lucide-react';

interface Step {
  stepNumber: number;
  delayDays: number;
  delayHours: number;
  useAI: boolean;
  name: string;
}

interface Sequence {
  id: string; name: string; description?: string | null; isActive: boolean;
  totalEnrolled: number; totalCompleted: number; totalReplied: number;
  steps: { id: string; stepNumber: number; delayDays: number; delayHours: number; useAI: boolean; totalSent: number; name?: string | null; }[];
}

const DEFAULT_STEPS: Step[] = [
  { stepNumber: 1, delayDays: 0, delayHours: 0, useAI: true, name: 'Initial Outreach' },
  { stepNumber: 2, delayDays: 3, delayHours: 0, useAI: true, name: 'Follow-up #1' },
  { stepNumber: 3, delayDays: 7, delayHours: 0, useAI: true, name: 'Follow-up #2' },
  { stepNumber: 4, delayDays: 14, delayHours: 0, useAI: true, name: 'Break-up Email' },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '10px', fontSize: '13px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', boxSizing: 'border-box',
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);

  useEffect(() => { fetchSequences(); }, []);

  async function fetchSequences() {
    setLoading(true);
    try {
      const res = await fetch('/api/email/sequences');
      const data = await res.json();
      setSequences(data.sequences ?? []);
    } catch {
      setSequences([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/email/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newName.trim(),
          description: newDesc.trim() || null,
          steps: steps.map(s => ({
            stepNumber: s.stepNumber,
            delayDays: s.delayDays,
            delayHours: s.delayHours,
            useAI: s.useAI,
            name: s.name,
          })),
        }),
      });
      setNewName(''); setNewDesc('');
      setSteps(DEFAULT_STEPS);
      setShowForm(false);
      fetchSequences();
    } catch { }
    setCreating(false);
  }

  async function handleToggle(sequenceId: string, current: boolean) {
    setToggling(sequenceId);
    try {
      const res = await fetch('/api/email/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', sequenceId, isActive: !current }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic update
        setSequences(prev => prev.map(s =>
          s.id === sequenceId ? { ...s, isActive: !current } : s
        ));
      }
    } catch { }
    setToggling(null);
  }

  function addStep() {
    setSteps(prev => [...prev, {
      stepNumber: prev.length + 1,
      delayDays: (prev[prev.length - 1]?.delayDays ?? 0) + 3,
      delayHours: 0,
      useAI: true,
      name: `Follow-up #${prev.length}`,
    }]);
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  function updateStep(idx: number, key: keyof Step, value: any) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  }

  return (
    <div style={{ padding: '28px 32px', background: '#0a0a0f', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>Email Sequences</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Automated AI-powered outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 18px', borderRadius: '12px', fontSize: '13px',
            fontWeight: 500, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> New Sequence
        </button>
      </div>

      {/* ── Create Form ───────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '20px', padding: '24px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>Create New Sequence</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>Sequence Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Cold Outreach Campaign" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>Description</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this sequence for?" style={inp} />
            </div>
          </div>

          {/* Steps editor */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>Email Steps ({steps.length})</p>
              <button
                onClick={addStep}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a5b4fc', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                <Plus size={13} /> Add Step
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '28px 1.5fr 100px 80px auto auto',
                  alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {/* Step number */}
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#a5b4fc' }}>
                    {step.stepNumber}
                  </div>

                  {/* Name */}
                  <input
                    value={step.name}
                    onChange={e => updateStep(idx, 'name', e.target.value)}
                    placeholder={`Step ${step.stepNumber} name`}
                    style={{ ...inp, padding: '7px 10px' }}
                  />

                  {/* Delay days */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min={0}
                      value={step.delayDays}
                      onChange={e => updateStep(idx, 'delayDays', parseInt(e.target.value) || 0)}
                      style={{ ...inp, padding: '7px 10px', paddingRight: '28px' }}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>days</span>
                  </div>

                  {/* Delay hours */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min={0} max={23}
                      value={step.delayHours}
                      onChange={e => updateStep(idx, 'delayHours', parseInt(e.target.value) || 0)}
                      style={{ ...inp, padding: '7px 10px', paddingRight: '28px' }}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>hrs</span>
                  </div>

                  {/* AI toggle */}
                  <button
                    onClick={() => updateStep(idx, 'useAI', !step.useAI)}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                      cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                      background: step.useAI ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                      color: step.useAI ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {step.useAI ? '✦ AI' : 'Manual'}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeStep(idx)}
                    disabled={steps.length <= 1}
                    style={{ background: 'none', border: 'none', cursor: steps.length > 1 ? 'pointer' : 'not-allowed', color: 'rgba(255,255,255,0.2)', opacity: steps.length > 1 ? 1 : 0.3 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
              Days/hours = delay after previous step. Day 0 = send immediately.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 22px', borderRadius: '10px', fontSize: '13px',
                fontWeight: 500, background: '#6366f1', color: '#fff', border: 'none',
                cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
                opacity: creating || !newName.trim() ? 0.6 : 1,
              }}
            >
              {creating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              Create Sequence
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); setSteps(DEFAULT_STEPS); }}
              style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Sequences list ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Loading...</div>
      ) : sequences.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <Mail size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '0 0 4px' }}>No sequences yet</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>Create your first sequence above</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sequences.map((seq) => (
            <div key={seq.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>{seq.name}</h3>
                    <span style={{
                      fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '100px',
                      background: seq.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                      color: seq.isActive ? '#6ee7b7' : '#9ca3af',
                    }}>{seq.isActive ? 'Active' : 'Paused'}</span>
                  </div>
                  {seq.description && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{seq.description}</p>}
                </div>

                {/* Pause/Resume button */}
                <button
                  onClick={() => handleToggle(seq.id, seq.isActive)}
                  disabled={toggling === seq.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                    cursor: toggling === seq.id ? 'not-allowed' : 'pointer',
                    border: '1px solid',
                    background: seq.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    borderColor: seq.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
                    color: seq.isActive ? '#fca5a5' : '#6ee7b7',
                    opacity: toggling === seq.id ? 0.6 : 1,
                  }}
                >
                  {toggling === seq.id
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : seq.isActive ? <Pause size={13} /> : <Play size={13} />}
                  {seq.isActive ? 'Pause' : 'Resume'}
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '28px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Enrolled', value: seq.totalEnrolled, icon: Users, color: '#818cf8' },
                  { label: 'Completed', value: seq.totalCompleted, icon: CheckCircle, color: '#6ee7b7' },
                  { label: 'Replied', value: seq.totalReplied, icon: MessageSquare, color: '#60a5fa' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <s.icon size={15} style={{ color: s.color }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Steps</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {seq.steps.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>No steps configured</span>
                  ) : seq.steps.map((step, idx) => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap',
                      }}>
                        <span style={{ color: '#a5b4fc' }}>Step {step.stepNumber}</span>
                        {' · '}
                        {step.delayDays > 0 ? `Day ${step.delayDays}` : step.delayHours > 0 ? `${step.delayHours}h` : 'Day 0'}
                        {step.useAI && <span style={{ color: '#818cf8', marginLeft: '4px', fontSize: '10px' }}>AI</span>}
                        {step.totalSent > 0 && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>{step.totalSent} sent</span>}
                      </div>
                      {idx < seq.steps.length - 1 && (
                        <ArrowRight size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { Mail, Plus, Users, CheckCircle, Play, Pause } from 'lucide-react';

// interface Step {
//   id:          string;
//   stepNumber:  number;
//   name:        string;
//   delayDays:   number;
//   delayHours:  number;
//   useAI:       boolean;
//   totalSent:   number;
//   totalOpened: number;
// }

// interface Sequence {
//   id:             string;
//   name:           string;
//   description:    string;
//   isActive:       boolean;
//   totalEnrolled:  number;
//   totalCompleted: number;
//   totalReplied:   number;
//   agent:          { id: string; name: string } | null;
//   steps:          Step[];
//   enrollments:    { id: string }[];
// }

// export default function SequencesPage() {
//   const [sequences, setSequences]       = useState<Sequence[]>([]);
//   const [loading, setLoading]           = useState(true);
//   const [showCreate, setShowCreate]     = useState(false);
//   const [creating, setCreating]         = useState(false);
//   const [newSeqName, setNewSeqName]     = useState('');
//   const [newSeqDesc, setNewSeqDesc]     = useState('');

//   useEffect(() => { fetchSequences(); }, []);

//   async function fetchSequences() {
//     try {
//       const res  = await fetch('/api/email/sequences');
//       const data = await res.json();
//       setSequences(data.sequences ?? []);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function createSequence() {
//     if (!newSeqName.trim()) return;
//     setCreating(true);
//     try {
//       const res = await fetch('/api/email/sequences', {
//         method:  'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body:    JSON.stringify({
//           name:        newSeqName,
//           description: newSeqDesc,
//           steps: [
//             { stepNumber: 1, name: 'Initial Outreach', delayDays: 0,  delayHours: 0, useAI: true },
//             { stepNumber: 2, name: 'Follow-up #1',     delayDays: 3,  delayHours: 0, useAI: true },
//             { stepNumber: 3, name: 'Follow-up #2',     delayDays: 7,  delayHours: 0, useAI: true },
//             { stepNumber: 4, name: 'Break-up email',   delayDays: 14, delayHours: 0, useAI: true },
//           ],
//         }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setShowCreate(false);
//         setNewSeqName('');
//         setNewSeqDesc('');
//         fetchSequences();
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setCreating(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Email Sequences</h1>
//           <p className="text-gray-500 mt-1">Automated AI-powered outreach campaigns</p>
//         </div>
//         <button
//           onClick={() => setShowCreate(true)}
//           className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
//         >
//           <Plus className="w-4 h-4" />
//           New Sequence
//         </button>
//       </div>

//       {/* Create Modal */}
//       {showCreate && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
//             <h2 className="text-xl font-semibold mb-4">Create Email Sequence</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Name</label>
//                 <input
//                   type="text"
//                   value={newSeqName}
//                   onChange={(e) => setNewSeqName(e.target.value)}
//                   placeholder="e.g. HOT Lead Outreach"
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
//                 <textarea
//                   value={newSeqDesc}
//                   onChange={(e) => setNewSeqDesc(e.target.value)}
//                   placeholder="What is this sequence for?"
//                   rows={3}
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//               <p className="text-sm text-gray-500">
//                 A 4-step AI-generated sequence will be created automatically: Day 0, Day 3, Day 7, Day 14.
//               </p>
//             </div>
//             <div className="flex gap-3 mt-6">
//               <button
//                 onClick={() => setShowCreate(false)}
//                 className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={createSequence}
//                 disabled={creating || !newSeqName.trim()}
//                 className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
//               >
//                 {creating ? 'Creating...' : 'Create Sequence'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {sequences.length === 0 ? (
//         <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
//           <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-gray-700">No sequences yet</h3>
//           <p className="text-gray-400 mt-1">Create your first AI email sequence to start automating outreach</p>
//           <button
//             onClick={() => setShowCreate(true)}
//             className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
//           >
//             Create Sequence
//           </button>
//         </div>
//       ) : (
//         <div className="grid gap-6">
//           {sequences.map((seq) => (
//             <div key={seq.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
//               {/* Sequence Header */}
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <div className="flex items-center gap-2">
//                     <h3 className="text-lg font-semibold text-gray-900">{seq.name}</h3>
//                     <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//                       seq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
//                     }`}>
//                       {seq.isActive ? 'Active' : 'Paused'}
//                     </span>
//                   </div>
//                   {seq.description && (
//                     <p className="text-sm text-gray-500 mt-0.5">{seq.description}</p>
//                   )}
//                 </div>
//                 {seq.isActive
//                   ? <Pause className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
//                   : <Play  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
//                 }
//               </div>

//               {/* Stats */}
//               <div className="grid grid-cols-3 gap-4 mb-5">
//                 <div className="text-center bg-gray-50 rounded-xl p-3">
//                   <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
//                     <Users className="w-4 h-4" />
//                   </div>
//                   <div className="text-xl font-bold text-gray-900">{seq.totalEnrolled}</div>
//                   <div className="text-xs text-gray-500">Enrolled</div>
//                 </div>
//                 <div className="text-center bg-gray-50 rounded-xl p-3">
//                   <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
//                     <CheckCircle className="w-4 h-4" />
//                   </div>
//                   <div className="text-xl font-bold text-gray-900">{seq.totalCompleted}</div>
//                   <div className="text-xs text-gray-500">Completed</div>
//                 </div>
//                 <div className="text-center bg-gray-50 rounded-xl p-3">
//                   <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
//                     <Mail className="w-4 h-4" />
//                   </div>
//                   <div className="text-xl font-bold text-gray-900">{seq.totalReplied}</div>
//                   <div className="text-xs text-gray-500">Replied</div>
//                 </div>
//               </div>

//               {/* Steps Timeline */}
//               <div className="space-y-2">
//                 <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</p>
//                 <div className="flex items-center gap-2 flex-wrap">
//                   {seq.steps.map((step, idx) => (
//                     <div key={step.id} className="flex items-center gap-2">
//                       <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-sm">
//                         <span className="font-medium text-indigo-700">Step {step.stepNumber}</span>
//                         <span className="text-gray-500 ml-1">
//                           {step.delayDays === 0 && step.stepNumber === 1
//                             ? '· Day 0'
//                             : `· Day ${seq.steps.slice(0, idx + 1).reduce((acc, s) => acc + s.delayDays, 0)}`
//                           }
//                         </span>
//                         {step.useAI && (
//                           <span className="ml-1 text-xs text-purple-600 font-medium">AI</span>
//                         )}
//                         <span className="ml-2 text-gray-400 text-xs">{step.totalSent} sent</span>
//                       </div>
//                       {idx < seq.steps.length - 1 && (
//                         <div className="w-4 h-0.5 bg-gray-200" />
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }