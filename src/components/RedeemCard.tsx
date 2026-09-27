"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";
import type { Reward } from "@/lib/db";
import { Alert } from "./ui";

function RedeemButton({ affordable }: { affordable: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!affordable || pending}
      className="rounded-control bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-primary-ink disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-400"
    >
      {pending ? "Canjeando…" : "Canjear"}
    </button>
  );
}

export function RedeemCard({
  reward,
  balance,
  action,
}: {
  reward: Reward;
  balance: number;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, null);
  const affordable = balance >= reward.cost;
  const short = reward.cost - balance;

  return (
    <form action={formAction} className="flex flex-col justify-between gap-4 rounded-card border border-line bg-white p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{reward.category}</p>
        <h3 className="text-[16px] font-semibold text-ink-900">{reward.title}</h3>
        <p className="text-[13px] text-ink-500">{reward.description}</p>
      </div>

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="ok">{state.ok}</Alert>}

      <input type="hidden" name="rewardId" value={reward.id} />

      <div className="space-y-3">
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-semibold text-ink-900">{reward.cost}</span>
            <span className="text-[13px] text-ink-500">pts</span>
          </span>
          <RedeemButton affordable={affordable} />
        </div>
        {!affordable && <p className="text-[12px] text-ink-400">Te faltan {short} puntos.</p>}
      </div>
    </form>
  );
}
