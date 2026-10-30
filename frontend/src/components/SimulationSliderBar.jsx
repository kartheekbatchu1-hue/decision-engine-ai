export default function SimulationSliderBar({ criteria, weights, onChange }) {
  return (
    <div className="space-y-5">
      {criteria.map((c) => {
        const currentWeight = weights[c.name] ?? c.weight ?? 5;
        return (
          <div key={c.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-200">{c.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  ({c.is_maximize !== false ? '↑ Maximize' : '↓ Minimize'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4">{1}</span>
                <span className="text-lg font-bold text-brand-400 min-w-[2rem] text-center">
                  {currentWeight}
                </span>
                <span className="text-xs text-slate-500 w-4">{10}</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={currentWeight}
                onChange={(e) => onChange(c.name, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer
                  bg-gradient-to-r from-brand-600 to-brand-400"
                style={{
                  background: `linear-gradient(to right, #4f46e5 0%, #818cf8 ${((currentWeight - 1) / 9) * 100}%, #1e293b ${((currentWeight - 1) / 9) * 100}%, #1e293b 100%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

