import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Entrar</h1>
      <p className="mb-6 text-sm text-muted">Usa el correo con el que creaste tu organización.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
