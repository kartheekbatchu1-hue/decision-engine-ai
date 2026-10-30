import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, Trash2, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import { decisionsApi } from '../services/api.js';

const DOMAINS = [
  'Strategic Operations', 'Product & Engineering', 'Finance & Procurement',
  'Personal & Career', 'Healthcare Operations', 'Supply Chain',
];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];
const URGENCY_COLORS = {
  Low: 'border-slate-600 text-slate-300',
  Medium: 'border-yellow-500/50 text-yellow-300',
  High: 'border-orange-500/50 text-orange-300',
  Critical: 'border-red-500/50 text-red-300',
};

const STEP_LABELS = ['Context', 'Alternatives', 'Criteria', 'Review'];

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                ${done ? 'bg-brand-600 border-brand-600 text-white' : active ? 'border-brand-500 text-brand-400' : 'border-slate-700 text-slate-600'}`}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-brand-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
            {i < total - 1 && <div className={`w-8 sm:w-16 h-px ${i < current ? 'bg-brand-600' : 'bg-slate-800'} mb-5`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateDecisionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    domain: '',
    urgency: 'Medium',
    problem_statement: '',
    alternatives: [
      { name: '', description: '', estimated_cost: '', time_to_implement_weeks: '' },
      { name: '', description: '', estimated_cost: '', time_to_implement_weeks: '' },
    ],
    criteria: [
      { name: 'Cost', weight: 8, is_maximize: false },
      { name: 'Speed', weight: 7, is_maximize: true },
    ],
  });

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // ─── Alternatives ───────────────────────────────────────
  const addAlt = () => setForm(f => ({
    ...f,
    alternatives: [...f.alternatives, { name: '', description: '', estimated_cost: '', time_to_implement_weeks: '' }],
  }));
  const removeAlt = (i) => setForm(f => ({ ...f, alternatives: f.alternatives.filter((_, idx) => idx !== i) }));
  const updateAlt = (i, field, value) => setForm(f => ({
    ...f,
    alternatives: f.alternatives.map((a, idx) => idx === i ? { ...a, [field]: value } : a),
  }));

  // ─── Criteria ────────────────────────────────────────────
  const addCrit = () => setForm(f => ({
    ...f,
    criteria: [...f.criteria, { name: '', weight: 5, is_maximize: true }],
  }));
  const removeCrit = (i) => setForm(f => ({ ...f, criteria: f.criteria.filter((_, idx) => idx !== i) }));
  const updateCrit = (i, field, value) => setForm(f => ({
    ...f,
    criteria: f.criteria.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
  }));

  // ─── Validation per step ─────────────────────────────────
  const canProceed = () => {
    if (step === 0) return form.title.length >= 3 && form.domain && form.problem_statement.length >= 10;
    if (step === 1) return form.alternatives.length >= 2 && form.alternatives.every(a => a.name.trim());
    if (step === 2) return form.criteria.length >= 1 && form.criteria.every(c => c.name.trim());
    return true;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...form,
        alternatives: form.alternatives.map(a => ({
          ...a,
          estimated_cost: a.estimated_cost ? Number(a.estimated_cost) : null,
          time_to_implement_weeks: a.time_to_implement_weeks ? Number(a.time_to_implement_weeks) : null,
        })),
      };

      const created = await decisionsApi.create(payload);
      navigate(`/decisions/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">New Decision Model</h1>
        <p className="text-slate-400 text-sm">Define your problem and let AI guide your decision.</p>
      </div>

      <StepIndicator current={step} total={4} />

      <div className="glass-card p-6 sm:p-8">
        {/* ── Step 0: Context ── */}
        {step === 0 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Decision Context</h2>

            <div>
              <label className="label">Decision Title *</label>
              <input className="input" placeholder="e.g., Enterprise Cloud Migration Q1 2025" value={form.title}
                onChange={e => updateField('title', e.target.value)} />
            </div>

            <div>
              <label className="label">Domain *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOMAINS.map(d => (
                  <button key={d} type="button"
                    onClick={() => updateField('domain', d)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 text-left
                      ${form.domain === d ? 'bg-brand-600/20 border-brand-500/50 text-brand-300' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Urgency Level *</label>
              <div className="flex gap-2">
                {URGENCIES.map(u => (
                  <button key={u} type="button"
                    onClick={() => updateField('urgency', u)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                      ${form.urgency === u ? `bg-slate-800 ${URGENCY_COLORS[u]}` : 'bg-slate-800/40 border-slate-700 text-slate-600 hover:text-slate-400'}`}
                  >{u}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Problem Statement *</label>
              <textarea className="input min-h-[120px] resize-y" rows={5}
                placeholder="Describe the decision you need to make, key constraints, goals, and background context..."
                value={form.problem_statement} onChange={e => updateField('problem_statement', e.target.value)} />
              <p className="text-xs text-slate-600 mt-1">{form.problem_statement.length} characters (min 10)</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Alternatives ── */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-200">Decision Alternatives</h2>
              <span className="text-xs text-slate-500">{form.alternatives.length} options</span>
            </div>

            {form.alternatives.map((alt, i) => (
              <div key={i} className="bg-slate-800/40 rounded-xl p-4 space-y-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Option {String.fromCharCode(65 + i)}</span>
                  {form.alternatives.length > 2 && (
                    <button onClick={() => removeAlt(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input className="input" placeholder="Option name (e.g., In-House Build)" value={alt.name}
                  onChange={e => updateAlt(i, 'name', e.target.value)} />
                <textarea className="input min-h-[80px] resize-none text-sm" rows={3}
                  placeholder="Description, key features, or relevant notes..."
                  value={alt.description} onChange={e => updateAlt(i, 'description', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Estimated Cost ($)</label>
                    <input className="input text-sm" type="number" min="0" placeholder="e.g., 250000"
                      value={alt.estimated_cost} onChange={e => updateAlt(i, 'estimated_cost', e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Time (weeks)</label>
                    <input className="input text-sm" type="number" min="1" placeholder="e.g., 12"
                      value={alt.time_to_implement_weeks} onChange={e => updateAlt(i, 'time_to_implement_weeks', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addAlt} className="btn-ghost w-full py-3 border border-dashed border-slate-700 hover:border-brand-500/50">
              <Plus size={16} /> Add Another Option
            </button>
          </div>
        )}

        {/* ── Step 2: Criteria ── */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-200">Decision Criteria</h2>
              <span className="text-xs text-slate-500">{form.criteria.length} criteria</span>
            </div>

            {form.criteria.map((crit, i) => (
              <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 flex-wrap">
                  <input className="input flex-1 min-w-[140px] text-sm" placeholder="Criterion name (e.g., Cost, Speed)"
                    value={crit.name} onChange={e => updateCrit(i, 'name', e.target.value)} />

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-slate-500">Weight</label>
                    <input className="input w-16 text-sm text-center" type="number" min="1" max="10"
                      value={crit.weight} onChange={e => updateCrit(i, 'weight', Number(e.target.value))} />
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button type="button"
                      onClick={() => updateCrit(i, 'is_maximize', true)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${crit.is_maximize ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >↑ Max</button>
                    <button type="button"
                      onClick={() => updateCrit(i, 'is_maximize', false)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${!crit.is_maximize ? 'bg-red-900/40 border-red-500/50 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                    >↓ Min</button>
                  </div>

                  {form.criteria.length > 1 && (
                    <button onClick={() => removeCrit(i)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <input type="range" min="1" max="10" value={crit.weight}
                    onChange={e => updateCrit(i, 'weight', Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #4f46e5 ${((crit.weight - 1) / 9) * 100}%, #1e293b ${((crit.weight - 1) / 9) * 100}%)` }}
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>Low priority (1)</span><span>Critical (10)</span>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addCrit} className="btn-ghost w-full py-3 border border-dashed border-slate-700 hover:border-brand-500/50">
              <Plus size={16} /> Add Criterion
            </button>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-up">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Review & Create</h2>

            <div className="bg-slate-800/40 rounded-xl p-4 space-y-2 border border-slate-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Title</span>
                <span className="text-slate-200 font-medium">{form.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Domain</span>
                <span className="text-brand-400 font-medium">{form.domain}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Urgency</span>
                <span className="text-slate-300">{form.urgency}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Problem Statement</p>
              <p className="text-sm text-slate-300">{form.problem_statement}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">{form.alternatives.length} Alternatives</p>
                {form.alternatives.map((a, i) => (
                  <p key={i} className="text-sm text-slate-300 font-medium">• {a.name}</p>
                ))}
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">{form.criteria.length} Criteria</p>
                {form.criteria.map((c, i) => (
                  <p key={i} className="text-sm text-slate-300 font-medium">• {c.name} (w:{c.weight})</p>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-brand-900/20 border border-brand-700/30 text-sm text-brand-300 flex gap-3">
              <Brain size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <span>After creating, you can trigger the Gemini AI analysis to get MCDA scores, risk profiles, and an explainable recommendation.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-800/60">
          <button
            onClick={() => setStep(s => s - 1)}
            className="btn-ghost"
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Create Decision
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

