import type { ReactNode } from "react";
import type { Person } from "@/lib/db";
import { AppBar } from "./AppBar";
import { MobileTabs } from "./NavLinks";

export function AppShell({
  user,
  points,
  section,
  children,
}: {
  user: Person;
  points: number;
  section?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted">
      <AppBar user={user} points={points} section={section} />
      <main className="mx-auto max-w-[1360px] space-y-6 px-5 py-8 pb-24 sm:px-10 sm:pb-10">{children}</main>
      <MobileTabs />
    </div>
  );
}
