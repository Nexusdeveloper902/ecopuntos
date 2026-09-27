export function MonthlyBars({ data }: { data: Array<{ label: string; points: number }> }) {
  if (data.length === 0) return <p className="text-[13px] text-ink-500">Sin depósitos todavía.</p>;
  const max = Math.max(1, ...data.map((d) => d.points));
  return (
    <div className="flex gap-4" role="img" aria-label="Puntos ganados por mes">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end justify-center">
            <div
              className="w-full max-w-[56px] rounded-t-[4px] bg-primary"
              style={{ height: `${Math.max(4, (d.points / max) * 100)}%` }}
              title={`${d.label}: ${d.points} pts`}
            />
          </div>
          <span className="text-[11px] font-medium text-ink-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function CompositionBars({ data }: { data: Array<{ name: string; points: number }> }) {
  if (data.length === 0) return <p className="text-[13px] text-ink-500">Sin datos.</p>;
  const total = Math.max(1, data.reduce((sum, d) => sum + d.points, 0));
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = Math.round((d.points / total) * 100);
        return (
          <div key={d.name} className="flex items-center gap-4">
            <span className="w-[110px] shrink-0 text-[13px] text-ink-600">{d.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-[4px] bg-muted">
              <div className="h-full rounded-[4px] bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-[42px] shrink-0 text-right text-[13px] text-ink-500">{pct} %</span>
          </div>
        );
      })}
    </div>
  );
}
