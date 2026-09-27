import type { HistoryRow } from "@/lib/db";

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-ink-500">Todavía no hay movimientos.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            <th className="pb-3 pr-4 font-semibold">Fecha</th>
            <th className="pb-3 pr-4 font-semibold">Ubicación</th>
            <th className="pb-3 pr-4 font-semibold">Detalle</th>
            <th className="pb-3 pr-4 text-right font-semibold">Puntos</th>
            <th className="pb-3 text-right font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.kind}-${r.id}`} className="border-t border-line text-[13px]">
              <td className="whitespace-nowrap py-3 pr-4 text-ink-500">{r.date.slice(0, 10)}</td>
              <td className="py-3 pr-4 text-ink-600">{r.place}</td>
              <td className="py-3 pr-4 text-ink-900">{r.detail}</td>
              <td className={`py-3 pr-4 text-right font-semibold ${r.pts < 0 ? "text-danger" : "text-primary-ink"}`}>
                {r.pts > 0 ? `+${r.pts}` : r.pts}
              </td>
              <td className="py-3 text-right text-ink-500">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
