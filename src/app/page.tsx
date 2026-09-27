import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Card, SectionHeader } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { MATERIALS, STATIONS, listRewards, totals } from "@/lib/db";

// Presentation copy from the "Page / Landing" Penpot board; the numbers in
// the points table and rewards below come from the database instead.
const MATERIAL_NOTES: Record<string, string> = {
  pet: "Botellas y envases",
  aluminio: "Latas y conservas",
  vidrio: "Envases de vidrio",
  carton: "Papel y cartón",
  ewaste: "Pilas y aparatos",
};

const HERO_STATS: Array<[string, string]> = [
  ["45 t", "Residuos procesados"],
  ["98,4 %", "Pureza de material"],
  ["120.000", "Puntos canjeados"],
  ["340 %", "Adopción anual"],
];

const NAV = [
  { href: "#materiales", label: "Producto" },
  { href: "#impacto", label: "Impacto" },
  { href: "#recompensas", label: "Recompensas" },
  { href: "#estaciones", label: "Estaciones" },
];

const shell = "mx-auto w-full max-w-[1360px] px-5 sm:px-10";
const primaryBtn =
  "inline-block rounded-control bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-ink";

export default async function LandingPage() {
  const user = await currentUser();
  const points = user ? totals(user.id).points : null;
  const appHref = user ? "/dashboard" : "/login";
  const joinHref = user ? "/dashboard" : "/register";
  const redeemHref = user ? "/rewards" : "/login";
  const rewards = listRewards();

  return (
    <div className="min-h-screen bg-white text-ink-900">
      {/* utility band */}
      <div className="border-b border-line">
        <div
          className={`${shell} flex h-10 items-center justify-between text-[13px]`}
        >
          <p className="text-ink-500">
            Red de contenedores activa en 45 estaciones urbanas.
          </p>
          <Link
            href="#simulador"
            className="font-medium text-primary-ink hover:underline"
          >
            Probar simulador →
          </Link>
        </div>
      </div>

      {/* nav */}
      <header className="border-b border-line bg-white">
        <div
          className={`${shell} flex h-16 items-center justify-between gap-6`}
        >
          <Logo size={28} />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-ink-600 transition hover:text-ink-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-[13px] text-ink-900 md:inline">
                  {user.name}
                </span>
                <Link href="/dashboard" className={primaryBtn}>
                  Ir al Panel
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-control border border-line px-4 py-2.5 text-sm text-ink-600 transition hover:bg-muted"
                >
                  Entrar
                </Link>
                <Link href="/register" className={primaryBtn}>
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <section id="impacto" className="bg-dark text-white">
        <div
          className={`${shell} grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]`}
        >
          <div className="max-w-[640px] space-y-5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#34d399]">
              Plataforma de reciclaje con incentivos
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">
              Convierte lo que reciclas en recompensas reales.
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              Deposita plástico, vidrio, aluminio o papel en contenedores
              inteligentes y acumula puntos canjeables en transporte, comercio y
              servicios.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={appHref} className={primaryBtn}>
                Probar el dashboard
              </Link>
              <Link
                href="#materiales"
                className="inline-block rounded-control border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver tabla de puntos
              </Link>
            </div>
          </div>
          <dl className="divide-y divide-white/10">
            {HERO_STATS.map(([v, l]) => (
              <div key={l} className="flex flex-col space-y-1 py-4 first:pt-0 last:pb-0">
                <dt className="order-2 text-[13px] text-slate-400">{l}</dt>
                <dd className="order-1 text-[28px] font-semibold tracking-tight">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* points table */}
      <section id="materiales" className="bg-muted">
        <div className={`${shell} space-y-8 py-16`}>
          <SectionHeader
            kicker="Tabla de incentivos"
            title="¿Cuánto vale tu reciclaje?"
            description="Puntuamos cada material según su valor de recuperación real."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {MATERIALS.map((m) => (
              <Card key={m.key} className="space-y-3 p-5">
                <h3 className="text-[16px] font-semibold">{m.name}</h3>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[20px] font-semibold">{m.points}</span>
                  <span className="text-[13px] text-ink-500">
                    pts / {m.unit === "kg" ? "kg" : "unidad"}
                  </span>
                </p>
                <p className="border-t border-line pt-3 text-[13px] text-ink-400">
                  {MATERIAL_NOTES[m.key]}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* simulator */}
      <section id="simulador" className="bg-white">
        <div className={`${shell} py-14`}>
          <div className="flex flex-col gap-6 rounded-panel bg-primary-tint p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[640px] space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-primary-ink">
                Simulador de depósito
              </p>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[20px] font-semibold">150 puntos</span>
                <span className="text-sm text-primary-ink">
                  por 15 unidades de PET
                </span>
              </p>
              <p className="text-[13px] text-primary-ink">
                1,2 kg de CO₂ y 18 L de agua ahorrados · equivale a un pase de
                bus urbano.
              </p>
            </div>
            <Link href={joinHref} className={`${primaryBtn} shrink-0`}>
              Abrir calculadora
            </Link>
          </div>
        </div>
      </section>

      {/* stations */}
      <section id="estaciones" className="border-t border-line bg-white">
        <div className={`${shell} space-y-5 py-12`}>
          <SectionHeader
            kicker="Red de contenedores"
            title="Estaciones activas"
            description="Contenedores inteligentes con báscula y lector IoT en cada punto."
          />
          <ul className="flex flex-wrap gap-2">
            {STATIONS.map((s) => (
              <li
                key={s}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] text-ink-600"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* rewards */}
      <section id="recompensas" className="bg-muted">
        <div className={`${shell} space-y-8 py-16`}>
          <SectionHeader
            kicker="Catálogo de canjes"
            title="Recompensas disponibles"
            description="Canjea tus puntos en transporte, comercio y entretenimiento."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rewards.map((r) => (
              <Card
                key={r.id}
                className="flex flex-col justify-between gap-4 p-5"
              >
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    {r.category}
                  </p>
                  <h3 className="text-[16px] font-semibold">{r.title}</h3>
                  <p className="text-[13px] text-ink-500">{r.description}</p>
                </div>
                <p className="flex items-center justify-between border-t border-line pt-4">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-semibold">{r.cost}</span>
                    <span className="text-[13px] text-ink-500">pts</span>
                  </span>
                  <Link
                    href={redeemHref}
                    className="text-sm font-medium text-primary-ink hover:underline"
                  >
                    Canjear →
                  </Link>
                </p>
              </Card>
            ))}
          </div>
          {points === null && (
            <p className="text-sm text-ink-500">
              <Link
                href="/register"
                className="font-medium text-primary-ink hover:underline"
              >
                Crea tu cuenta
              </Link>{" "}
              para empezar a acumular puntos hoy mismo.
            </p>
          )}
        </div>
      </section>

      {/* footer */}
      <footer className="bg-dark text-white">
        <div
          className={`${shell} flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="space-y-2">
            <Logo size={24} tone="dark" />
            <p className="text-[13px] text-slate-400">
              © 2026 Plataforma de economía circular.
            </p>
          </div>
          <nav className="flex items-center gap-8">
            {NAV.slice(0, 3).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13px] text-slate-300 transition hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
