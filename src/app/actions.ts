"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser, endSession, startSession } from "@/lib/auth";
import {
  MATERIALS,
  STATIONS,
  createUser,
  listRewards,
  recordDeposit,
  recordRedemption,
  totals,
  userByEmail,
} from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export type FormState = { error?: string; ok?: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email");
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!EMAIL_RE.test(email)) return { error: "Ese correo no parece válido." };
  if (password.length < 8) return { error: "La contraseña necesita al menos 8 caracteres." };
  if (userByEmail(email)) return { error: "Ya existe una cuenta con ese correo." };

  const user = createUser(email, name, password);
  await startSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email");
  const password = String(fd.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) return { error: "Correo y contraseña son obligatorios." };

  const user = userByEmail(email);
  // Same message either way: don't leak which emails exist.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await startSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}

export async function depositAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const station = text(fd, "station");
  const materialKey = text(fd, "material");
  const qty = Number(fd.get("qty"));

  if (!STATIONS.includes(station as (typeof STATIONS)[number])) return { error: "Elige una estación válida." };
  if (!MATERIALS.some((m) => m.key === materialKey)) return { error: "Elige un material válido." };
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return { error: "La cantidad debe estar entre 1 y 100." };

  const points = recordDeposit(user.id, station, materialKey, qty);
  revalidatePath("/dashboard");
  return { ok: `Depósito confirmado: +${points} EcoPuntos.` };
}

export async function redeemAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const id = Number(fd.get("rewardId"));
  const reward = listRewards().find((r) => r.id === id);
  if (!reward) return { error: "Esa recompensa no existe." };

  // Re-check the balance server side; the button state is not a trust boundary.
  const balance = totals(user.id).points;
  if (balance < reward.cost) {
    return { error: `Te faltan ${reward.cost - balance} puntos para este canje.` };
  }

  const code = recordRedemption(user.id, reward);
  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { ok: `Canje listo. Código ${code}` };
}
