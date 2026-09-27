"use client";

import { useActionState, useEffect, useState } from "react";
import type { FormState } from "@/app/actions";
import type { Material } from "@/lib/db";
import { Alert, Field, inputClass } from "./ui";
import { SubmitButton } from "./SubmitButton";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={strong ? "font-semibold text-ink-900" : "text-ink-900"}>{value}</span>
    </div>
  );
}

export function DepositForm({
  stations,
  materials,
  action,
}: {
  stations: string[];
  materials: Material[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, null);
  const [key, setKey] = useState(materials[0].key);
  const [qty, setQty] = useState(5);

  // React resets the form DOM after a form action, which desyncs a controlled select
  // from its state. Reset both together so the dropdown and the preview always agree.
  useEffect(() => {
    if (state?.ok) {
      setKey(materials[0].key);
      setQty(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const material = materials.find((m) => m.key === key) ?? materials[0];
  const points = qty * material.points;
  const co2 = (qty * material.co2).toFixed(2);
  const water = (qty * material.water).toFixed(1);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="ok">{state.ok}</Alert>}

      <Field label="Estación" htmlFor="station">
        <select id="station" name="station" className={inputClass} defaultValue={stations[0]}>
          {stations.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Material" htmlFor="material">
        <select
          id="material"
          name="material"
          className={inputClass}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        >
          {materials.map((m) => (
            <option key={m.key} value={m.key}>
              {m.name} · {m.points} pts / {m.unit}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`Cantidad (${material.unit})`} htmlFor="qty">
        <input
          id="qty"
          name="qty"
          type="number"
          min={1}
          max={100}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          className={inputClass}
        />
      </Field>

      <div className="space-y-2 border-t border-line pt-4 text-[13px]">
        <Row label="Puntos a acreditar" value={`${points} pts`} strong />
        <Row label="CO₂ evitado" value={`${co2} kg`} />
        <Row label="Agua ahorrada" value={`${water} L`} />
      </div>

      <SubmitButton className="w-full" pendingLabel="Registrando…">
        Confirmar depósito
      </SubmitButton>
    </form>
  );
}
