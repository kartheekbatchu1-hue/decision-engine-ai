const SEVERITY_CONFIG = {
  LOW:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  MEDIUM:   { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/30',  dot: 'bg-yellow-400' },
  HIGH:     { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/30',  dot: 'bg-orange-400' },
  CRITICAL: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400' },
};

export default function RiskBadge({ severity, size = 'sm' }) {
  const cfg = SEVERITY_CONFIG[severity?.toUpperCase()] || SEVERITY_CONFIG.LOW;
  const padding = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-lg border font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${severity === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      {severity}
    </span>
  );
}

