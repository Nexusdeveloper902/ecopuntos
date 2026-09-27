import { logoutAction } from "@/app/actions";
import type { Person } from "@/lib/db";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export function AppBar({ user, points, section }: { user: Person; points: number; section?: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-6 px-5 sm:px-10">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          {section && <span className="hidden text-sm text-ink-400 md:inline">/ {section}</span>}
        </div>
        <NavLinks />
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-ink-900 md:inline">{user.name}</span>
          <span className="text-[13px] font-semibold text-primary-ink">{points.toLocaleString("es-ES")} pts</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-control border border-line px-3 py-1.5 text-[13px] text-ink-600 transition hover:bg-muted"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
