import { redirect } from "next/navigation";

import { getSesionAdmin } from "@/lib/auth/dal";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const sesion = await getSesionAdmin();

  if (sesion) {
    redirect("/panel");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-sky">Portafolio</p>
        <h1 className="text-2xl font-bold">Acceso al panel</h1>
        <p className="text-sm text-chalk-dim">
          Solo cuentas con permisos de administración pueden entrar.
        </p>
      </header>

      <section className="rounded-2xl border border-glass-border bg-glass p-6">
        <LoginForm />
      </section>
    </main>
  );
}
