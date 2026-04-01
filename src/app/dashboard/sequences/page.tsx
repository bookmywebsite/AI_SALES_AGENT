'use client';

import { useEffect, useState } from 'react';
import { Mail, Plus, Users, CheckCircle, Play, Pause } from 'lucide-react';

interface Step {
  id:          string;
  stepNumber:  number;
  name:        string;
  delayDays:   number;
  delayHours:  number;
  useAI:       boolean;
  totalSent:   number;
  totalOpened: number;
}

interface Sequence {
  id:             string;
  name:           string;
  description:    string;
  isActive:       boolean;
  totalEnrolled:  number;
  totalCompleted: number;
  totalReplied:   number;
  agent:          { id: string; name: string } | null;
  steps:          Step[];
  enrollments:    { id: string }[];
}

export default function SequencesPage() {
  const [sequences, setSequences]       = useState<Sequence[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [creating, setCreating]         = useState(false);
  const [newSeqName, setNewSeqName]     = useState('');
  const [newSeqDesc, setNewSeqDesc]     = useState('');

  useEffect(() => { fetchSequences(); }, []);

  async function fetchSequences() {
    try {
      const res  = await fetch('/api/email/sequences');
      const data = await res.json();
      setSequences(data.sequences ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function createSequence() {
    if (!newSeqName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/email/sequences', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:        newSeqName,
          description: newSeqDesc,
          steps: [
            { stepNumber: 1, name: 'Initial Outreach', delayDays: 0,  delayHours: 0, useAI: true },
            { stepNumber: 2, name: 'Follow-up #1',     delayDays: 3,  delayHours: 0, useAI: true },
            { stepNumber: 3, name: 'Follow-up #2',     delayDays: 7,  delayHours: 0, useAI: true },
            { stepNumber: 4, name: 'Break-up email',   delayDays: 14, delayHours: 0, useAI: true },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewSeqName('');
        setNewSeqDesc('');
        fetchSequences();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Sequences</h1>
          <p className="text-gray-500 mt-1">Automated AI-powered outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Create Email Sequence</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Name</label>
                <input
                  type="text"
                  value={newSeqName}
                  onChange={(e) => setNewSeqName(e.target.value)}
                  placeholder="e.g. HOT Lead Outreach"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newSeqDesc}
                  onChange={(e) => setNewSeqDesc(e.target.value)}
                  placeholder="What is this sequence for?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-sm text-gray-500">
                A 4-step AI-generated sequence will be created automatically: Day 0, Day 3, Day 7, Day 14.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createSequence}
                disabled={creating || !newSeqName.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sequences.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No sequences yet</h3>
          <p className="text-gray-400 mt-1">Create your first AI email sequence to start automating outreach</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Create Sequence
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {sequences.map((seq) => (
            <div key={seq.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Sequence Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{seq.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      seq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {seq.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  {seq.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{seq.description}</p>
                  )}
                </div>
                {seq.isActive
                  ? <Pause className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  : <Play  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                }
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{seq.totalEnrolled}</div>
                  <div className="text-xs text-gray-500">Enrolled</div>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{seq.totalCompleted}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{seq.totalReplied}</div>
                  <div className="text-xs text-gray-500">Replied</div>
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {seq.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-sm">
                        <span className="font-medium text-indigo-700">Step {step.stepNumber}</span>
                        <span className="text-gray-500 ml-1">
                          {step.delayDays === 0 && step.stepNumber === 1
                            ? '· Day 0'
                            : `· Day ${seq.steps.slice(0, idx + 1).reduce((acc, s) => acc + s.delayDays, 0)}`
                          }
                        </span>
                        {step.useAI && (
                          <span className="ml-1 text-xs text-purple-600 font-medium">AI</span>
                        )}
                        <span className="ml-2 text-gray-400 text-xs">{step.totalSent} sent</span>
                      </div>
                      {idx < seq.steps.length - 1 && (
                        <div className="w-4 h-0.5 bg-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}