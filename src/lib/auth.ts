import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession, sessionUser, type Person } from "./db";

const COOKIE = "ecopuntos_session";

export async function startSession(userId: number) {
  const { token, expires } = createSession(userId);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) destroySession(token);
  store.delete(COOKIE);
}

export async function currentUser(): Promise<Person | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return sessionUser(token) ?? null;
}

export async function requireUser(): Promise<Person> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
