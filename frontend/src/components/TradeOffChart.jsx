import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-slate-100 mb-1">{d?.name}</p>
      <p className="text-slate-400">Score: <span className="text-brand-400 font-medium">{d?.score?.toFixed(1)}</span></p>
      {d?.cost != null && <p className="text-slate-400">Cost: <span className="text-emerald-400 font-medium">${d.cost?.toLocaleString()}</span></p>}
      {d?.weeks != null && <p className="text-slate-400">Time: <span className="text-yellow-400 font-medium">{d.weeks}w</span></p>}
    </div>
  );
};

export default function TradeOffChart({ scores = [], alternatives = [] }) {
  if (!scores.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No data available for chart
      </div>
    );
  }

  const data = scores.map((s, i) => {
    const alt = alternatives.find(a => a.name === s.alternative_name);
    return {
      name: s.alternative_name,
      score: s.total_weighted_score,
      cost: alt?.estimated_cost ? Number(alt.estimated_cost) : null,
      weeks: alt?.time_to_implement_weeks ?? null,
      index: i,
    };
  });

  const hasCost = data.some(d => d.cost != null);
  const hasWeeks = data.some(d => d.weeks != null);

  if (!hasCost && !hasWeeks) {
    // Score bar chart fallback
    return (
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300 font-medium">{d.name}</span>
              <span className="text-brand-400 font-semibold">{d.score?.toFixed(2)}/10</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(d.score / 10) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          type="number"
          dataKey={hasCost ? 'cost' : 'weeks'}
          name={hasCost ? 'Estimated Cost ($)' : 'Weeks'}
          tick={{ fill: '#64748b', fontSize: 12 }}
          label={{ value: hasCost ? 'Cost ($)' : 'Time (weeks)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="score"
          name="Score"
          domain={[0, 10]}
          tick={{ fill: '#64748b', fontSize: 12 }}
          label={{ value: 'MCDA Score', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 12 }}
        />
        <ZAxis range={[80, 200]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={data} name="Alternatives">
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={COLORS[i % COLORS.length]} fillOpacity={0.9} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

