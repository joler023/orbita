import Link from "next/link";

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium text-orbita-600">Borrador · ORB-D12</p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-orbita-900">
        WhatsApp del negocio, para todo el equipo.
      </h1>
      <p className="max-w-xl text-muted">
        CRM conversacional con agentes que ejecutan acciones. Esta página es un rough
        reemplazable; el copy y el layout definitivo llegan con Figma.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/registro"
          className="inline-flex h-11 items-center rounded-xl bg-orbita-600 px-4 text-sm font-medium text-white hover:bg-orbita-700"
        >
          Empezar
        </Link>
        <Link
          href="/precios"
          className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium"
        >
          Ver precios
        </Link>
      </div>
    </div>
  );
}
