'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Phone, Mail, Search } from 'lucide-react';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';

interface Lead {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  score?: number | null;
  tier?: string | null;
  status: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [tierFilter, setTierFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [agentId, setAgentId]           = useState('');

  useEffect(() => {
    fetchLeads();
    fetchAgent();
  }, [tierFilter, statusFilter]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tierFilter)   params.set('tier',   tierFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchAgent() {
    try {
      const res  = await fetch('/api/agent/default');
      const data = await res.json();
      if (data.agentId) setAgentId(data.agentId);
    } catch {}
  }

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.email.toLowerCase().includes(q) ||
      l.firstName?.toLowerCase().includes(q) ||
      l.lastName?.toLowerCase().includes(q) ||
      l.company?.toLowerCase().includes(q)
    );
  });

  const tierFilters   = ['HOT', 'WARM', 'COLD'];
  const statusFilters = ['NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'MEETING_SET', 'WON', 'LOST'];

  const tierColor: Record<string, string> = {
    HOT:  'bg-red-100 text-red-700 border-red-200',
    WARM: 'bg-orange-100 text-orange-700 border-orange-200',
    COLD: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const statusColor: Record<string, string> = {
    NEW:         'bg-gray-100 text-gray-600',
    CONTACTED:   'bg-blue-100 text-blue-700',
    ENGAGED:     'bg-indigo-100 text-indigo-700',
    QUALIFIED:   'bg-green-100 text-green-700',
    MEETING_SET: 'bg-purple-100 text-purple-700',
    WON:         'bg-emerald-100 text-emerald-700',
    LOST:        'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{filtered.length} leads found</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, company..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        />
      </div>

      {/* Tier filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Tier:</span>
        <button
          onClick={() => setTierFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !tierFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {tierFilters.map((tier) => (
          <button
            key={tier}
            onClick={() => setTierFilter(tierFilter === tier ? '' : tier)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              tierFilter === tier
                ? tierColor[tier]
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tier === 'HOT' ? '🔥' : tier === 'WARM' ? '🌤️' : '❄️'} {tier}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Status:</span>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            !statusFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === status
                ? statusColor[status]
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">No leads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {lead.firstName ?? ''} {lead.lastName ?? ''}
                        {!lead.firstName && !lead.lastName && 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">{lead.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {lead.company ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{lead.score}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.tier ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tierColor[lead.tier]}`}>
                        {lead.tier === 'HOT' ? '🔥' : lead.tier === 'WARM' ? '🌤️' : '❄️'} {lead.tier}
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        Actions
                      </button>
                      <button
                        onClick={() => { setSelectedLead(lead); }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setSelectedLead(lead); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions Panel */}
      {selectedLead && (
        <QuickActionsPanel
          lead={selectedLead}
          agentId={agentId}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}