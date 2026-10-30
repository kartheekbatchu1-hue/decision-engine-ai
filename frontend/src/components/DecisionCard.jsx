import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BarChart3, AlertTriangle, CheckCircle2, Archive, FileEdit } from 'lucide-react';
import RiskBadge from './RiskBadge.jsx';

const DOMAIN_COLORS = {
  'Strategic Operations': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Product & Engineering': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Finance & Procurement': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Personal & Career': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Healthcare Operations': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Supply Chain': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const STATUS_CONFIG = {
  DRAFT: { icon: FileEdit, color: 'text-slate-400', label: 'Draft', bg: 'bg-slate-800/60' },
  ANALYZED: { icon: BarChart3, color: 'text-brand-400', label: 'Analyzed', bg: 'bg-brand-900/30' },
  EXECUTED: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Executed', bg: 'bg-emerald-900/30' },
  ARCHIVED: { icon: Archive, color: 'text-slate-500', label: 'Archived', bg: 'bg-slate-800/40' },
};

const URGENCY_COLORS = {
  Low: 'text-slate-400',
  Medium: 'text-yellow-400',
  High: 'text-orange-400',
  Critical: 'text-red-400',
};

export default function DecisionCard({ decision, onDelete }) {
  const status = STATUS_CONFIG[decision.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;
  const domainClass = DOMAIN_COLORS[decision.domain] || 'bg-slate-800 text-slate-400 border-slate-700';
  const urgencyColor = URGENCY_COLORS[decision.urgency] || 'text-slate-400';
  const updatedAt = new Date(decision.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="glass-card p-5 hover:border-slate-700/80 transition-all duration-300 group flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`badge border ${domainClass}`}>{decision.domain}</span>
            <span className={`badge ${status.bg} ${status.color}`}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 text-base leading-tight line-clamp-2 group-hover:text-brand-300 transition-colors">
            {decision.title}
          </h3>
        </div>
      </div>

      {/* Problem statement */}
      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
        {decision.problem_statement}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <BarChart3 size={12} className="text-brand-400" />
          {decision.alternative_count || 0} options
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={12} className="text-yellow-400" />
          {decision.criteria_count || 0} criteria
        </span>
        <span className={`flex items-center gap-1 ml-auto font-medium ${urgencyColor}`}>
          {decision.urgency}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
        <span className="flex items-center gap-1 text-xs text-slate-600">
          <Clock size={11} />
          {updatedAt}
        </span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => onDelete(decision.id)}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1"
            >
              Delete
            </button>
          )}
          <Link
            to={`/decisions/${decision.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            View <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

