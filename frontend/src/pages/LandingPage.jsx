import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3, Shield, ArrowRight, CheckCircle, Layers, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered MCDA',
    desc: 'Gemini 2.5 evaluates alternatives against weighted criteria using structured output schemas.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: BarChart3,
    title: 'Visual Trade-Off Analysis',
    desc: 'Interactive scatter plots and radar charts reveal cost-vs-impact and risk exposure at a glance.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Zap,
    title: 'What-If Simulation',
    desc: 'Dynamically adjust criteria weights with sliders and see rankings update in real time.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Shield,
    title: 'Risk Profiling',
    desc: 'Multi-dimensional risk assessment with severity ratings and step-by-step mitigation plans.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Layers,
    title: 'Multi-Domain Workspaces',
    desc: 'Isolated decision contexts for Strategy, Finance, Product, Healthcare, and more.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Audit Trail',
    desc: 'Full history of decisions, revisions, overrides, and execution tracking for compliance.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
];

const domains = [
  'Strategic Operations', 'Product & Engineering', 'Finance & Procurement',
  'Personal & Career', 'Healthcare Operations', 'Supply Chain',
];

const steps = [
  { n: '01', title: 'Define Problem', desc: 'Set your domain, urgency, and problem statement.' },
  { n: '02', title: 'Add Options', desc: 'Input 2+ alternatives with costs and timelines.' },
  { n: '03', title: 'Set Criteria', desc: 'Define weighted criteria to evaluate against.' },
  { n: '04', title: 'AI Analysis', desc: 'Gemini scores, ranks, and explains every trade-off.' },
  { n: '05', title: 'Simulate', desc: 'Stress-test with live weight sliders.' },
  { n: '06', title: 'Execute', desc: 'Export summary or mark decision as executed.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain size={17} className="text-white" />
            </div>
            <span className="font-bold text-slate-100">DecisionEngine <span className="text-brand-400">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
            <Link to="/decisions/new" className="btn-primary text-sm py-2 px-4">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* BG glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-900/40 border border-brand-500/30 text-brand-400 text-sm font-medium mb-8">
            <Zap size={14} />
            Powered by Google Gemini 2.5 · Structured AI Outputs
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08]">
            <span className="text-slate-100">Eliminate</span>{' '}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Decision Paralysis
            </span>
            <br />
            <span className="text-slate-300">with AI Intelligence</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Convert fragmented data into structured decision matrices, trade-off curves, and risk-scored action plans.
            Built for high-stakes decisions in capital allocation, sourcing, product strategy, and personal finance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/decisions/new" className="btn-primary text-base py-3 px-8 w-full sm:w-auto justify-center">
              <Zap size={18} />
              Start Free Analysis
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base py-3 px-8 w-full sm:w-auto justify-center">
              <BarChart3 size={18} />
              View Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { label: 'Decision Domains', value: '6+' },
              { label: 'AI Model', value: 'Gemini 2.5' },
              { label: 'Structured Output', value: '100%' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-brand-400">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
              Everything you need to decide with confidence
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              DecisionEngine AI combines operations research, AI reasoning, and interactive visualization into one platform.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="glass-card p-6 hover:border-slate-700 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="flex gap-4">
                <span className="text-3xl font-black text-slate-800 leading-none mt-0.5">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Built for every decision domain</h2>
          <p className="text-slate-400 mb-12">Isolated workspaces for your specific context and constraints.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {domains.map(d => (
              <span key={d} className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-300 font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Brain size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to make better decisions?</h2>
          <p className="text-slate-400 mb-8">
            Start your first AI-powered decision analysis in under 5 minutes.
          </p>
          <Link to="/decisions/new" className="btn-primary text-base py-3 px-8 inline-flex">
            <Zap size={18} />
            Create First Decision
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 px-6 text-center text-sm text-slate-600">
        <p>DecisionEngine AI — Enterprise Decision Intelligence Platform · Powered by Google Gemini 2.5</p>
      </footer>
    </div>
  );
}

