import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-5 py-12">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Entra a tu cuenta</h1>
          <p className="text-[13px] text-ink-500">Sigue acumulando EcoPuntos por reciclar.</p>
        </div>

        <div className="rounded-card border border-line bg-white p-6">
          <AuthForm mode="login" action={loginAction} />
        </div>

        <p className="text-center text-[13px] text-ink-500">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-primary-ink underline">
            Crear una
          </Link>
        </p>

        {/* ponytail: seeded demo login, shown so a fresh install is usable. Remove for real deployments. */}
        <p className="text-center text-[12px] text-ink-400">Cuenta demo · demo@ecopuntos.app · demo1234</p>
      </div>
    </div>
  );
}
