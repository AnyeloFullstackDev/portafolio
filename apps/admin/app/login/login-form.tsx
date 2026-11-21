"use client";

import { useActionState } from "react";

import { iniciarSesion, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = { error: null };

export function LoginForm() {
  const [estado, accion, pendiente] = useActionState(
    iniciarSesion,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-chalk">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-describedby={estado.error ? "error-login" : undefined}
          className="rounded-lg border border-glass-border bg-void-2 px-4 py-3 text-chalk outline-none focus:border-sky"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-chalk">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={estado.error ? "error-login" : undefined}
          className="rounded-lg border border-glass-border bg-void-2 px-4 py-3 text-chalk outline-none focus:border-sky"
        />
      </div>

      {estado.error ? (
        <p
          id="error-login"
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {estado.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="rounded-lg bg-sky px-4 py-3 font-semibold text-void transition hover:bg-sky-bright disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
