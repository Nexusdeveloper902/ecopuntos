"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Panel" },
  { href: "/rewards", label: "Recompensas" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 rounded-control bg-muted p-1 sm:flex">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-[6px] px-4 py-2 text-[13px] font-semibold transition ${
              active ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white sm:hidden">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 py-3 text-center text-[12px] font-semibold ${
              active ? "text-primary-ink" : "text-ink-400"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
