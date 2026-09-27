export function Mark({ size = 28 }: { size?: number }) {
  const glyph = Math.round(size * 0.68);
  return (
    // radius is 25% of the size: one brand rule at every scale.
    <span
      className="inline-grid shrink-0 place-items-center rounded-[25%] bg-primary"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="3.2 3.2 17.6 17.6" width={glyph} height={glyph}>
        <path d="M16.02 6.27 A7 7 0 1 1 7.98 6.27" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M9.78 5.01 L8.59 8.53 L6.07 4.93 Z" fill="#fff" />
        <circle cx="12" cy="12" r="2.4" fill="#fff" />
      </svg>
    </span>
  );
}

export function Logo({ size = 28, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="EcoPuntos">
      <Mark size={size} />
      <span className="text-[16px] font-semibold tracking-tight">
        <span className={tone === "dark" ? "text-white" : "text-ink-900"}>Eco</span>
        <span className={tone === "dark" ? "text-[#34d399]" : "text-primary"}>Puntos</span>
      </span>
    </span>
  );
}
