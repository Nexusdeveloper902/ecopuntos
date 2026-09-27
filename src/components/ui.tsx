import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-white ${className}`}>{children}</div>;
}

export function SectionHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-[640px] space-y-1.5">
      {kicker && <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-ink">{kicker}</p>}
      <h2 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
      {description && <p className="text-[13px] text-ink-500">{description}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-[28px] font-bold leading-none tracking-tight text-ink-900">{value}</p>
      {sub && <p className="text-[13px] text-ink-400">{sub}</p>}
    </div>
  );
}

export function Alert({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) {
  const tone =
    kind === "error"
      ? "border-danger/30 bg-[#fff1f2] text-danger"
      : "border-primary/25 bg-primary-tint text-primary-ink";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-control border px-3 py-2 text-[13px] ${tone}`}>
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-control border border-line bg-white px-3 py-3 text-sm text-ink-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
