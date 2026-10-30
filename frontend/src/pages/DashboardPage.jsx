import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Brain, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { decisionsApi } from '../services/api.js';
import DecisionCard from '../components/DecisionCard.jsx';

const STATUS_COUNTS = ['DRAFT', 'ANALYZED', 'EXECUTED', 'ARCHIVED'];

export default function DashboardPage() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await decisionsApi.getAll();
      setDecisions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecisions(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this decision? This cannot be undone.')) return;
    try {
      await decisionsApi.delete(id);
      setDecisions(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const stats = {
    total: decisions.length,
    analyzed: decisions.filter(d => d.status === 'ANALYZED').length,
    executed: decisions.filter(d => d.status === 'EXECUTED').length,
    draft: decisions.filter(d => d.status === 'DRAFT').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Decision Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track your active decision models</p>
        </div>
        <Link to="/decisions/new" className="btn-primary">
          <Plus size={16} />
          New Decision
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Decisions', value: stats.total, icon: BarChart3, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'AI Analyzed', value: stats.analyzed, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Executed', value: stats.executed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Drafts', value: stats.draft, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
          <button onClick={fetchDecisions} className="ml-auto underline text-red-300">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded mb-3 w-1/3" />
              <div className="h-5 bg-slate-800 rounded mb-2" />
              <div className="h-4 bg-slate-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : decisions.length === 0 ? (
        /* Empty state */
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-5 bg-brand-900/40 rounded-2xl flex items-center justify-center">
            <Brain size={32} className="text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No decisions yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Create your first AI-powered decision model to start making data-driven, explainable choices.
          </p>
          <Link to="/decisions/new" className="btn-primary">
            <Plus size={16} />
            Create First Decision
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decisions.map(d => (
            <DecisionCard key={d.id} decision={d} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

