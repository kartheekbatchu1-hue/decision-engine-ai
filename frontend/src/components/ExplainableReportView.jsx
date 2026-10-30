import { CheckCircle2, AlertTriangle, TrendingUp, Lightbulb, ListChecks, XCircle } from 'lucide-react';
import RiskBadge from './RiskBadge.jsx';

export default function ExplainableReportView({ analysis, aiResult }) {
  if (!analysis && !aiResult) return null;

  const rec = analysis?.explainable_recommendation || {};
  const risks = Array.isArray(analysis?.risk_assessment) ? analysis.risk_assessment : [];
  const scores = Array.isArray(analysis?.mcda_scores) ? analysis.mcda_scores : [];
  const raw = aiResult || {};

  const executiveSummary = rec.executive_summary || raw.executive_summary || '';
  const tradeOffAnalysis = rec.trade_off_analysis || raw.trade_off_analysis || '';
  const failureModes = rec.failure_modes || raw.failure_modes || [];
  const actionPlan = rec.action_plan || raw.action_plan || [];
  const recommendedName = raw.recommended_option_name || '';
  const confidenceScore = raw.confidence_score || analysis?.overall_confidence_score || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Recommendation Header */}
      {recommendedName && (
        <div className="glass-card p-5 border-brand-500/30 bg-gradient-to-br from-brand-950/50 to-slate-900/60">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-brand-400" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">AI Recommendation</p>
              <h3 className="text-xl font-bold text-slate-100">{recommendedName}</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 max-w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Number(confidenceScore))}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  {Number(confidenceScore).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {executiveSummary && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-brand-400" />
            <h4 className="font-semibold text-slate-200">Executive Summary</h4>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{executiveSummary}</p>
        </div>
      )}

      {/* Trade-Off Analysis */}
      {tradeOffAnalysis && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-yellow-400" />
            <h4 className="font-semibold text-slate-200">Trade-Off Analysis</h4>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{tradeOffAnalysis}</p>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-400" />
            <h4 className="font-semibold text-slate-200">Risk Assessment</h4>
          </div>
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="bg-slate-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">{risk.alternative_name}</p>
                    <p className="text-sm font-medium text-slate-200">{risk.risk_factor}</p>
                  </div>
                  <RiskBadge severity={risk.severity} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-emerald-400 font-medium">Mitigation: </span>
                  {risk.mitigation_strategy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Modes */}
      {failureModes.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle size={16} className="text-red-400" />
            <h4 className="font-semibold text-slate-200">Failure Modes</h4>
          </div>
          <div className="space-y-2">
            {failureModes.map((fm, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">{fm.alternative_name}</p>
                  <p className="text-sm text-slate-300">{fm.failure_scenario}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-500">Prob: <span className={`font-medium ${fm.probability === 'HIGH' ? 'text-red-400' : fm.probability === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'}`}>{fm.probability}</span></p>
                  <p className="text-xs text-slate-500">Impact: <span className={`font-medium ${fm.impact === 'CRITICAL' || fm.impact === 'HIGH' ? 'text-red-400' : 'text-yellow-400'}`}>{fm.impact}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      {actionPlan.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={16} className="text-emerald-400" />
            <h4 className="font-semibold text-slate-200">Recommended Action Plan</h4>
          </div>
          <div className="space-y-3">
            {actionPlan.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-brand-400">{step.step_number || i + 1}</span>
                </div>
                <div className="flex-1 pb-3 border-b border-slate-800/60 last:border-0">
                  <p className="text-sm text-slate-200 font-medium">{step.action}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-500">⏱ {step.timeline}</span>
                    <span className="text-xs text-slate-500">👤 {step.owner}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

