import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History, ExternalLink, CheckCircle2, BarChart3, Archive,
  FileEdit, Clock, AlertTriangle, Brain,
} from 'lucide-react';
import { decisionsApi } from '../services/api.js';
import RiskBadge from '../components/RiskBadge.jsx';

const STATUS_CONFIG = {
  DRAFT:    { icon: FileEdit,     color: 'text-slate-400', bg: 'bg-slate-800/60',    label: 'Draft' },
  ANALYZED: { icon: BarChart3,    color: 'text-brand-400', bg: 'bg-brand-900/30',    label: 'Analyzed' },
  EXECUTED: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/30', label: 'Executed' },
  ARCHIVED: { icon: Archive,      color: 'text-slate-500', bg: 'bg-slate-800/40',    label: 'Archived' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryAuditPage() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await decisionsApi.getAll();
        setDecisions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = filter === 'ALL' ? decisions : decisions.filter(d => d.status === filter);

  const counts = {
    ALL: decisions.length,
    DRAFT: decisions.filter(d => d.status === 'DRAFT').length,
    ANALYZED: decisions.filter(d => d.status === 'ANALYZED').length,
    EXECUTED: decisions.filter(d => d.status === 'EXECUTED').length,
    ARCHIVED: decisions.filter(d => d.status === 'ARCHIVED').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <History size={22} className="text-brand-400" />
          Decision Audit Trail
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Full historical log of all decision models, revisions, and execution status.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-xl p-1 w-fit flex-wrap">
        {['ALL', 'DRAFT', 'ANALYZED', 'EXECUTED', 'ARCHIVED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {s} <span className="ml-1 opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="glass-card p-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Brain size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No decisions found{filter !== 'ALL' ? ` with status "${filter}"` : ''}.</p>
          <Link to="/decisions/new" className="btn-primary mt-4 inline-flex">Create Decision</Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left py-3.5 px-5 text-slate-500 font-medium">Decision</th>
                <th className="text-left py-3.5 px-4 text-slate-500 font-medium hidden sm:table-cell">Domain</th>
                <th className="text-center py-3.5 px-4 text-slate-500 font-medium">Status</th>
                <th className="text-center py-3.5 px-4 text-slate-500 font-medium hidden md:table-cell">Urgency</th>
                <th className="text-right py-3.5 px-4 text-slate-500 font-medium hidden lg:table-cell">Last Updated</th>
                <th className="text-center py-3.5 px-4 text-slate-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = cfg.icon;
                return (
                  <tr key={d.id}
                    className={`border-b border-slate-800/40 transition-colors hover:bg-slate-800/20 ${i % 2 === 0 ? '' : 'bg-slate-900/30'}`}
                  >
                    <td className="py-4 px-5">
                      <p className="font-medium text-slate-200 line-clamp-1">{d.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {d.alternative_count || 0} options · {d.criteria_count || 0} criteria
                      </p>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg">{d.domain}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center hidden md:table-cell">
                      <span className={`text-xs font-medium ${
                        d.urgency === 'Critical' ? 'text-red-400' :
                        d.urgency === 'High' ? 'text-orange-400' :
                        d.urgency === 'Medium' ? 'text-yellow-400' : 'text-slate-400'
                      }`}>{d.urgency}</span>
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      <span className="text-xs text-slate-600 flex items-center justify-end gap-1">
                        <Clock size={11} />
                        {formatDate(d.updated_at)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link to={`/decisions/${d.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        View <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {!loading && decisions.length > 0 && (
        <div className="mt-6 glass-card p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-400">{counts.EXECUTED}</p>
              <p className="text-xs text-slate-500 mt-0.5">Decisions Executed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{counts.ANALYZED}</p>
              <p className="text-xs text-slate-500 mt-0.5">AI Analyzed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-400">{counts.DRAFT}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Drafts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{counts.ARCHIVED}</p>
              <p className="text-xs text-slate-500 mt-0.5">Archived</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

