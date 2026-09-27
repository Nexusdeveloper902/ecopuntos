import { depositAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { CompositionBars, MonthlyBars } from "@/components/Charts";
import { DepositForm } from "@/components/DepositForm";
import { HistoryTable } from "@/components/HistoryTable";
import { Card, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MATERIALS, STATIONS, composition, history, levelFor, monthlyPoints, totals } from "@/lib/db";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardPage() {
  const user = await requireUser();
  const t = totals(user.id);
  const lvl = levelFor(t.points);
  const span = Math.max(1, lvl.next - lvl.floor);
  const progress = Math.min(100, Math.max(0, Math.round(((t.points - lvl.floor) / span) * 100)));

  const rows = history(user.id);
  const monthly = monthlyPoints(user.id, 6);
  const mix = composition(user.id);
  const nf = new Intl.NumberFormat("es-ES");

  return (
    <AppShell user={user} points={t.points} section="Panel">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Resumen de actividad</h1>
        <p className="text-[13px] text-ink-500">
          {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-[18px] font-bold text-white">
          {initials(user.name)}
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-[16px] font-semibold text-ink-900">{user.name}</p>
            <p className="text-[13px] text-ink-500">
              ID #ECO-{String(user.id).padStart(5, "0")} · Nivel {lvl.level} {lvl.title}
            </p>
          </div>
          <div className="max-w-[560px] space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-500">Progreso a nivel {lvl.level + 1}</span>
              <span className="font-medium text-ink-900">
                {nf.format(t.points)} / {nf.format(lvl.next)} pts
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <Stat label="EcoPuntos" value={nf.format(t.points)} sub="Disponible para canje" />
        </div>
        <div className="p-6">
          <Stat label="CO₂ reducido" value={`${t.co2} kg`} sub={`≈ ${Math.round(t.co2 * 1.4)} árboles salvados`} />
        </div>
        <div className="p-6">
          <Stat label="Agua ahorrada" value={`${t.water} L`} sub="Agua potable preservada" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="p-6">
          <h2 className="mb-5 text-[16px] font-semibold text-ink-900">Registrar depósito</h2>
          <DepositForm stations={[...STATIONS]} materials={MATERIALS} action={depositAction} />
        </Card>

        <div className="space-y-6">
          <Card className="space-y-6 p-6">
            <div className="space-y-1">
              <h2 className="text-[16px] font-semibold text-ink-900">Puntos por mes</h2>
              <p className="text-[13px] text-ink-500">Puntos ganados en los últimos seis meses.</p>
            </div>
            <MonthlyBars data={monthly} />
          </Card>

          <Card className="space-y-5 p-6">
            <h2 className="text-[16px] font-semibold text-ink-900">Composición por material</h2>
            <CompositionBars data={mix} />
          </Card>
        </div>
      </div>

      <Card className="space-y-5 p-6">
        <h2 className="text-[16px] font-semibold text-ink-900">Historial de movimientos</h2>
        <HistoryTable rows={rows} />
      </Card>
    </AppShell>
  );
}
