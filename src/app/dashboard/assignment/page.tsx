'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, Play, RefreshCw, CheckCircle, XCircle, Loader2, Zap, Calendar } from 'lucide-react';

interface Lead {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: string;
}

interface TeamMember {
  id: string;
  isAvailable: boolean;
  currentLeadCount: number;
  maxLeadsPerDay: number;
  totalAssigned: number;
  languages: string[];
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}

interface ScheduledJob {
  id: string;
  jobType: string;
  targetId: string;
  scheduledFor: string;
  status: string;
  attempts: number;
}

export default function AssignmentTestPage() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [team, setTeam]             = useState<TeamMember[]>([]);
  const [jobs, setJobs]             = useState<ScheduledJob[]>([]);
  const [loading, setLoading]       = useState(false);
  const [log, setLog]               = useState<string[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString('en-IN')}] ${msg}`, ...prev.slice(0, 19)]);
  }

  async function fetchAll() {
    await Promise.all([fetchLeads(), fetchTeam(), fetchJobs()]);
  }

  async function fetchLeads() {
    const res  = await fetch('/api/leads').catch(() => null);
    const data = await res?.json().catch(() => null);
    setLeads(data?.leads ?? []);
  }

  async function fetchTeam() {
    const res  = await fetch('/api/team').catch(() => null);
    const data = await res?.json().catch(() => null);
    setTeam(data?.members ?? []);
  }

  async function fetchJobs() {
    const res  = await fetch('/api/scheduler').catch(() => null);
    const data = await res?.json().catch(() => null);
    setJobs(data?.jobs ?? []);
  }

  // ── Add yourself as team member ───────────────────────────────────────────
  async function handleAddSelf() {
    setLoading(true);
    try {
      const res  = await fetch('/api/team', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'add_self', languages: ['EN', 'KN', 'HI'] }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ Added as team member (ID: ${data.member.id.slice(0, 8)}...)`);
        fetchTeam();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch {
      addLog('❌ Failed to add team member');
    } finally {
      setLoading(false);
    }
  }

  // ── Auto-assign all unassigned leads ─────────────────────────────────────
  async function handleBulkAssign() {
    const unassigned = leads.filter((l) => l.status === 'NEW' || l.status === 'CONTACTED');
    if (unassigned.length === 0) {
      addLog('⚠️ No unassigned leads found');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/assignment/assign', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ leadIds: unassigned.map((l) => l.id) }),
      });
      const data = await res.json();
      addLog(`✅ Bulk assign: ${data.assigned} assigned, ${data.failed} failed`);
      fetchLeads();
    } catch {
      addLog('❌ Bulk assign failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Assign single lead ────────────────────────────────────────────────────
  async function handleAssignLead(leadId: string) {
    setLoading(true);
    try {
      const res  = await fetch('/api/assignment/assign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ Lead assigned — ${data.reason}`);
        fetchLeads();
      } else {
        addLog(`⚠️ ${data.reason}`);
      }
    } catch {
      addLog('❌ Assignment failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Schedule bulk follow-ups ──────────────────────────────────────────────
  async function handleBulkFollowUp() {
    setLoading(true);
    try {
      const res  = await fetch('/api/scheduler', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'bulk_follow_up' }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ Scheduled ${data.scheduled} follow-up calls`);
        fetchJobs();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch {
      addLog('❌ Scheduling failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Process pending jobs now ──────────────────────────────────────────────
  async function handleProcessJobs() {
    setLoading(true);
    try {
      const res  = await fetch('/api/scheduler/process', { method: 'POST' });
      const data = await res.json();
      addLog(`✅ Processed: ${data.processed} jobs, failed: ${data.failed}`);
      fetchJobs();
    } catch {
      addLog('❌ Processing failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle team member availability ──────────────────────────────────────
  async function handleToggleAvailability(memberId: string, current: boolean) {
    const res  = await fetch('/api/team', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'toggle_availability', memberId, isAvailable: !current }),
    });
    const data = await res.json();
    if (data.success) {
      addLog(`✅ Availability set to ${!current ? 'Available' : 'Unavailable'}`);
      fetchTeam();
    }
  }

  const statusColor: Record<string, string> = {
    PENDING:    'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED:  'bg-green-100 text-green-700',
    FAILED:     'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assignment & Scheduler</h1>
        <p className="text-gray-500 mt-1">Test lead auto-assignment and 24/7 scheduling</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={handleAddSelf}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-violet-600 text-white rounded-2xl p-4 hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <Users className="w-6 h-6" />
          <span className="text-sm font-medium">Add Me as Team Member</span>
        </button>

        <button
          onClick={handleBulkAssign}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-blue-600 text-white rounded-2xl p-4 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Zap className="w-6 h-6" />
          <span className="text-sm font-medium">Auto-Assign All Leads</span>
        </button>

        <button
          onClick={handleBulkFollowUp}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-violet-500 text-white rounded-2xl p-4 hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm font-medium">Schedule Follow-ups</span>
        </button>

        <button
          onClick={handleProcessJobs}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-green-600 text-white rounded-2xl p-4 hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Play className="w-6 h-6" />
          <span className="text-sm font-medium">Process Jobs Now</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Team Members */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" />
              Team Members ({team.length})
            </h2>
            <button onClick={fetchTeam} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {team.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs mt-1">Click "Add Me as Team Member" above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {member.user.firstName ?? ''} {member.user.lastName ?? member.user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.currentLeadCount}/{member.maxLeadsPerDay} leads · {member.totalAssigned} total · {member.languages.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAvailability(member.id, member.isAvailable)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      member.isAvailable
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {member.isAvailable ? '🟢 Available' : '⚪ Unavailable'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Jobs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Scheduled Jobs ({jobs.length})
            </h2>
            <button onClick={fetchJobs} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No pending jobs</p>
              <p className="text-xs mt-1">Click "Schedule Follow-ups" to create jobs</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{job.jobType}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(job.scheduledFor).toLocaleString('en-IN')} · Attempt {job.attempts}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads with Assignment */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Leads — Assign Individually ({leads.length})
            </h2>
            <button onClick={fetchLeads} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No leads found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {leads.slice(0, 20).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {lead.firstName ?? lead.email}
                    </p>
                    <p className="text-xs text-gray-500">{lead.status} · {lead.phone ?? 'no phone'}</p>
                  </div>
                  <button
                    onClick={() => handleAssignLead(lead.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Activity Log
          </h2>

          {log.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No activity yet — run an action above</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono">
              {log.map((entry, i) => (
                <p key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
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