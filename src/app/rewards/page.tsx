import { redeemAction } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { RedeemCard } from "@/components/RedeemCard";
import { requireUser } from "@/lib/auth";
import { listRewards, totals } from "@/lib/db";

export default async function RewardsPage() {
  const user = await requireUser();
  const balance = totals(user.id).points;
  const rewards = listRewards();

  return (
    <AppShell user={user} points={balance} section="Recompensas">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Recompensas</h1>
        <p className="text-[13px] text-ink-500">
          Canjea tus EcoPuntos por productos y servicios de comercios aliados.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-500">Saldo disponible</p>
        <p className="text-[13px] font-semibold text-ink-900">
          {new Intl.NumberFormat("es-ES").format(balance)} pts
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {rewards.map((r) => (
          <RedeemCard key={r.id} reward={r} balance={balance} action={redeemAction} />
        ))}
      </div>
    </AppShell>
  );
}
