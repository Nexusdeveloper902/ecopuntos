"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { Alert, Field, inputClass } from "./ui";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, null);
  const isRegister = mode === "register";

  // Controlled on purpose: React resets uncontrolled fields after a form action,
  // which would wipe what the user typed when the server returns a validation error.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && <Alert kind="error">{state.error}</Alert>}

      {isRegister && (
        <Field label="Nombre" htmlFor="name">
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Camila Torres"
          />
        </Field>
      )}

      <Field label="Correo" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@correo.com"
        />
      </Field>

      <Field label="Contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Mínimo 8 caracteres"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Un momento…">
        {isRegister ? "Crear cuenta" : "Entrar"}
      </SubmitButton>
    </form>
  );
}
