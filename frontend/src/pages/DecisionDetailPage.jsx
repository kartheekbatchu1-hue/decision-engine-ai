import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Brain, Zap, AlertTriangle, ArrowLeft, Sliders, CheckCircle2,
  Archive, BarChart3, RefreshCw, ExternalLink,
} from 'lucide-react';
import { decisionsApi } from '../services/api.js';
import MCDAMatrixTable from '../components/MCDAMatrixTable.jsx';
import TradeOffChart from '../components/TradeOffChart.jsx';
import ExplainableReportView from '../components/ExplainableReportView.jsx';
import RiskBadge from '../components/RiskBadge.jsx';

const STATUS_ACTIONS = {
  ANALYZED: ['EXECUTED', 'ARCHIVED'],
  EXECUTED: ['ARCHIVED'],
  DRAFT: ['ARCHIVED'],
};

export default function DecisionDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix');

  const fetchDecision = async () => {
    try {
      setLoading(true);
      setError(null);
      const d = await decisionsApi.getById(id);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDecision(); }, [id]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setAnalyzeError(null);
      await decisionsApi.analyze(id);
      await fetchDecision();
      setActiveTab('report');
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await decisionsApi.updateStatus(id, status);
      setData(d => ({ ...d, status }));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-1/3 mb-6" />
      <div className="h-48 bg-slate-800 rounded-2xl mb-4" />
    </div>
  );

  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
      <p className="text-red-400 mb-4">{error}</p>
      <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
    </div>
  );

  if (!data) return null;

  const { analysis, alternatives, criteria } = data;
  const scores = analysis ? (Array.isArray(analysis.mcda_scores) ? analysis.mcda_scores : []) : [];
  const risks = analysis ? (Array.isArray(analysis.risk_assessment) ? analysis.risk_assessment : []) : [];
  const rec = analysis?.explainable_recommendation || {};

  const tabs = [
    { id: 'matrix', label: 'MCDA Matrix', disabled: !analysis },
    { id: 'chart', label: 'Trade-Off Chart', disabled: !analysis },
    { id: 'report', label: 'AI Report', disabled: !analysis },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link to="/dashboard" className="btn-ghost px-2 py-2 mt-1">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="badge bg-slate-800/60 text-slate-400 border border-slate-700">{data.domain}</span>
            <span className={`badge ${data.status === 'ANALYZED' ? 'bg-brand-900/30 text-brand-400' : data.status === 'EXECUTED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800/60 text-slate-400'}`}>
              {data.status}
            </span>
            <span className="badge bg-slate-800/60 text-slate-500 border border-slate-700/60">{data.urgency} urgency</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{data.title}</h1>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="glass-card p-5 mb-6">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Problem Statement</p>
        <p className="text-slate-300 text-sm leading-relaxed">{data.problem_statement}</p>
      </div>

      {/* Alternatives & Criteria summary */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">{alternatives.length} Alternatives</p>
          <div className="space-y-2">
            {alternatives.map((alt, i) => (
              <div key={alt.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">
                  <span className="text-brand-400 mr-1.5 text-xs">{String.fromCharCode(65 + i)}.</span>
                  {alt.name}
                </span>
                <div className="flex gap-3 text-xs text-slate-600">
                  {alt.estimated_cost && <span>${Number(alt.estimated_cost).toLocaleString()}</span>}
                  {alt.time_to_implement_weeks && <span>{alt.time_to_implement_weeks}w</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">{criteria.length} Criteria</p>
          <div className="space-y-2">
            {criteria.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">{c.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={c.is_maximize ? 'text-emerald-400' : 'text-red-400'}>
                    {c.is_maximize ? '↑ Max' : '↓ Min'}
                  </span>
                  <span className="bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded font-bold">w:{c.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analyze CTA */}
      {!analysis && (
        <div className="glass-card p-6 mb-6 border-brand-500/20 bg-gradient-to-br from-brand-950/30 to-slate-900/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-brand-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-200 mb-1">Ready for AI Analysis</h3>
              <p className="text-sm text-slate-400">
                Trigger Gemini to score all alternatives, profile risks, and generate an explainable recommendation.
              </p>
            </div>
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary shrink-0">
              {analyzing ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
              ) : (
                <><Zap size={16} />Run Analysis</>
              )}
            </button>
          </div>
          {analyzeError && (
            <div className="mt-3 p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-xs flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {analyzeError}
            </div>
          )}
        </div>
      )}

      {/* Re-analyze + Actions row (when analyzed) */}
      {analysis && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary text-sm py-2 px-4">
            {analyzing ? <><span className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin" />Re-analyzing...</> : <><RefreshCw size={14} />Re-analyze</>}
          </button>
          <Link to={`/decisions/${id}/simulate`} className="btn-secondary text-sm py-2 px-4">
            <Sliders size={14} />What-If Simulator
          </Link>
          {STATUS_ACTIONS[data.status]?.includes('EXECUTED') && (
            <button onClick={() => handleStatusChange('EXECUTED')} className="btn-secondary text-sm py-2 px-4 text-emerald-400 border-emerald-700/40">
              <CheckCircle2 size={14} />Mark Executed
            </button>
          )}
          {STATUS_ACTIONS[data.status]?.includes('ARCHIVED') && (
            <button onClick={() => handleStatusChange('ARCHIVED')} className="btn-ghost text-sm">
              <Archive size={14} />Archive
            </button>
          )}
          {analyzeError && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} />{analyzeError}
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      {analysis && (
        <>
          <div className="flex gap-1 mb-4 bg-slate-900/60 rounded-xl p-1 w-fit">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} disabled={t.disabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'} disabled:opacity-40`}
              >{t.label}</button>
            ))}
          </div>

          {activeTab === 'matrix' && (
            <div className="glass-card p-0 overflow-hidden animate-fade-in">
              <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-400" />
                <h3 className="font-semibold text-slate-200 text-sm">MCDA Scoring Matrix</h3>
              </div>
              <div className="p-4">
                <MCDAMatrixTable scores={scores} criteria={criteria} />
              </div>
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="glass-card p-5 animate-fade-in">
              <h3 className="font-semibold text-slate-200 text-sm mb-5 flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-400" />
                Trade-Off Analysis Chart
              </h3>
              <TradeOffChart scores={scores} alternatives={alternatives} />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="animate-fade-in">
              <ExplainableReportView analysis={analysis} aiResult={analysis?.raw_ai_response} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

