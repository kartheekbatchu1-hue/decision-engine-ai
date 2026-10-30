import { useMemo } from 'react';

const SCORE_COLORS = [
  { min: 8,   cls: 'bg-emerald-500/20 text-emerald-300 font-semibold' },
  { min: 6,   cls: 'bg-brand-500/20 text-brand-300' },
  { min: 4,   cls: 'bg-yellow-500/20 text-yellow-300' },
  { min: 0,   cls: 'bg-red-500/20 text-red-300' },
];

function scoreClass(score) {
  for (const c of SCORE_COLORS) {
    if (score >= c.min) return c.cls;
  }
  return '';
}

function ScoreBar({ value }) {
  return (
    <div className="mt-1.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
  );
}

export default function MCDAMatrixTable({ scores = [], criteria = [] }) {
  const allCriteria = useMemo(() => {
    if (criteria.length) return criteria.map(c => c.name);
    if (!scores.length) return [];
    return scores[0]?.criteria_breakdown?.map(cb => cb.criterion_name) || [];
  }, [scores, criteria]);

  if (!scores.length) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Run AI analysis to see the MCDA matrix
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-3 px-4 text-slate-400 font-medium whitespace-nowrap">Alternative</th>
            {allCriteria.map(c => (
              <th key={c} className="text-center py-3 px-3 text-slate-400 font-medium whitespace-nowrap text-xs">
                {c}
              </th>
            ))}
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Total Score</th>
          </tr>
        </thead>
        <tbody>
          {[...scores]
            .sort((a, b) => b.total_weighted_score - a.total_weighted_score)
            .map((row, rowIdx) => (
              <tr
                key={row.alternative_name}
                className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${rowIdx === 0 ? 'bg-brand-950/30' : ''}`}
              >
                <td className="py-4 px-4 font-medium text-slate-200 whitespace-nowrap">
                  {rowIdx === 0 && (
                    <span className="mr-2 text-xs bg-brand-600/20 text-brand-400 border border-brand-500/30 rounded-md px-1.5 py-0.5">
                      ★ Top
                    </span>
                  )}
                  {row.alternative_name}
                </td>
                {allCriteria.map(criterionName => {
                  const cb = row.criteria_breakdown?.find(c => c.criterion_name === criterionName);
                  const score = cb?.score_out_of_10 ?? 0;
                  return (
                    <td key={criterionName} className="py-3 px-3">
                      <div className={`text-center text-xs rounded-lg px-2 py-1 ${scoreClass(score)}`}>
                        {score.toFixed(1)}
                      </div>
                      <ScoreBar value={score} />
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-center">
                  <span className={`text-base font-bold ${rowIdx === 0 ? 'text-brand-400' : 'text-slate-300'}`}>
                    {row.total_weighted_score?.toFixed(2)}
                  </span>
                  <span className="text-slate-600 text-xs">/10</span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

