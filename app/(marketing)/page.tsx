import { Logo } from "@/components/brand/logo";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-orbita-600">
            Entrar
          </Link>
          <Link
            href="/registro"
            className="inline-flex h-10 items-center rounded-xl bg-orbita-500 px-4 text-sm font-medium text-white hover:bg-orbita-600"
          >
            Crear organización
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-16">
        <p className="text-sm font-medium text-orbita-600">CRM conversacional</p>
        <h1 className="text-4xl font-semibold tracking-tight text-orbita-900">
          WhatsApp del negocio, para todo el equipo.
        </h1>
        <p className="max-w-xl text-muted">
          El sitio público completo llega en otra historia. Mientras tanto, entra al dashboard o crea tu
          organización.
        </p>
        <div className="flex gap-3">
          <Link
            href="/registro"
            className="inline-flex h-11 items-center rounded-xl bg-orbita-500 px-4 text-sm font-medium text-white hover:bg-orbita-600"
          >
            Empezar
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}
