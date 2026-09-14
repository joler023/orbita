import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/producto", label: "Producto" },
  { href: "/precios", label: "Precios" },
  { href: "/comparativas", label: "Comparativas" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-surface">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
          <Logo />
          <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Sitio público">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-orbita-600">
              Entrar
            </Link>
            <Link
              href="/registro"
              className="inline-flex h-10 items-center rounded-xl bg-orbita-600 px-4 text-sm font-medium text-white hover:bg-orbita-700"
            >
              Crear organización
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</main>
      <footer className="border-t border-border px-6 py-6 text-sm text-muted">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-between gap-2">
          <p>Órbita — borrador del sitio público (ORB-D12).</p>
          <p>Diseño final pendiente de Figma.</p>
        </div>
      </footer>
    </div>
  );
}
