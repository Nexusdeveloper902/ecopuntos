import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-5 py-12">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Crea tu cuenta</h1>
          <p className="text-[13px] text-ink-500">Empieza a ganar recompensas reciclando.</p>
        </div>

        <div className="rounded-card border border-line bg-white p-6">
          <AuthForm mode="register" action={registerAction} />
        </div>

        <p className="text-center text-[13px] text-ink-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-primary-ink underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
