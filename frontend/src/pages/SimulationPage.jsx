import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sliders, RefreshCw, AlertTriangle, Trophy, Info } from 'lucide-react';
import { decisionsApi } from '../services/api.js';
import SimulationSliderBar from '../components/SimulationSliderBar.jsx';
import MCDAMatrixTable from '../components/MCDAMatrixTable.jsx';
import TradeOffChart from '../components/TradeOffChart.jsx';

export default function SimulationPage() {
  const { id } = useParams();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  // Weights: { criterionName: weightValue }
  const [weights, setWeights] = useState({});
  const [simulatedScores, setSimulatedScores] = useState(null);
  const [recommendedOption, setRecommendedOption] = useState(null);

  // Original scores from AI analysis
  const [originalScores, setOriginalScores] = useState([]);

  const debounceRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const d = await decisionsApi.getById(id);
        setDecision(d);

        // Initialize weights from criteria
        const initWeights = {};
        d.criteria.forEach(c => { initWeights[c.name] = c.weight; });
        setWeights(initWeights);

        // Load original scores
        if (d.analysis?.mcda_scores) {
          const scores = Array.isArray(d.analysis.mcda_scores) ? d.analysis.mcda_scores : [];
          setOriginalScores(scores);
          setSimulatedScores(scores);
          setRecommendedOption(d.analysis.raw_ai_response?.recommended_option_name || null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const runSimulation = useCallback(async (currentWeights) => {
    if (!originalScores.length) return;
    try {
      setSimulating(true);
      const criteriaWeights = Object.entries(currentWeights).map(([name, weight]) => ({ name, weight }));
      const result = await decisionsApi.simulate(id, {
        criteria_weights: criteriaWeights,
        scores: originalScores,
      });
      setSimulatedScores(result.simulated_scores);
      setRecommendedOption(result.recommended_option);
    } catch (err) {
      // Silently fail — keep showing previous
    } finally {
      setSimulating(false);
    }
  }, [id, originalScores]);

  const handleWeightChange = (criterionName, value) => {
    setWeights(prev => {
      const updated = { ...prev, [criterionName]: value };
      // Debounce API call
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSimulation(updated), 400);
      return updated;
    });
  };

  const resetWeights = () => {
    if (!decision) return;
    const resetW = {};
    decision.criteria.forEach(c => { resetW[c.name] = c.weight; });
    setWeights(resetW);
    runSimulation(resetW);
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-1/3 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="h-80 bg-slate-800 rounded-2xl" />
        <div className="lg:col-span-2 h-80 bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );

  if (error || !decision) return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <AlertTriangle size={36} className="text-red-400 mx-auto mb-4" />
      <p className="text-red-400 mb-4">{error || 'Decision not found'}</p>
      <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
    </div>
  );

  if (!originalScores.length) return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <Sliders size={36} className="text-slate-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">No AI analysis yet</h3>
      <p className="text-slate-500 text-sm mb-6">Run the AI analysis on the decision detail page first.</p>
      <Link to={`/decisions/${id}`} className="btn-primary">Go to Decision</Link>
    </div>
  );

  const displayScores = simulatedScores || originalScores;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/decisions/${id}`} className="btn-ghost px-2 py-2">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders size={20} className="text-brand-400" />
            What-If Simulator
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{decision.title}</p>
        </div>
      </div>

      {/* Instruction Banner */}
      <div className="glass-card p-4 mb-6 flex items-start gap-3 border-brand-500/20">
        <Info size={16} className="text-brand-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400">
          Adjust criteria weights using the sliders below. Rankings update automatically to show how your decision outcome changes under different priorities.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Slider Panel */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-200 text-sm">Criteria Weights</h3>
            <button onClick={resetWeights} className="btn-ghost text-xs py-1.5 px-2.5">
              <RefreshCw size={12} /> Reset
            </button>
          </div>
          <SimulationSliderBar
            criteria={decision.criteria}
            weights={weights}
            onChange={handleWeightChange}
          />
          {simulating && (
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-400">
              <span className="w-3 h-3 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
              Recalculating...
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Winner Banner */}
          {recommendedOption && (
            <div className="glass-card p-4 border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900/60">
              <div className="flex items-center gap-3">
                <Trophy size={20} className="text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-500">Simulated Top Recommendation</p>
                  <p className="font-bold text-slate-100 text-lg">{recommendedOption}</p>
                </div>
                {simulating && (
                  <span className="ml-auto text-xs text-brand-400 animate-pulse">Updating...</span>
                )}
              </div>
            </div>
          )}

          {/* MCDA Table */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/60">
              <h3 className="font-semibold text-slate-200 text-sm">Simulated Score Rankings</h3>
            </div>
            <div className="p-4">
              <MCDAMatrixTable scores={displayScores} criteria={decision.criteria} />
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4">Score vs. Cost Trade-Off</h3>
            <TradeOffChart scores={displayScores} alternatives={decision.alternatives} />
          </div>
        </div>
      </div>
    </div>
  );
}

