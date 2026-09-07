function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </article>
  );
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sin responder" value="—" />
        <KpiCard label="Tiempo de respuesta" value="—" />
        <KpiCard label="Resueltas por IA" value="—" />
        <KpiCard label="Consumo del mes" value="—" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-medium text-foreground">Actividad de la semana</h2>
          <p className="mt-1 text-sm text-muted">
            Cuando haya conversaciones, verás el resumen aquí.
          </p>
          <div className="mt-8 flex h-40 items-end justify-between gap-3 px-2">
            {WEEKDAYS.map((day, index) => (
              <div key={`${day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-orbita-100" style={{ height: "18%" }} />
                <span className="text-xs text-muted">{day}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="min-h-56 rounded-xl border border-dashed border-border bg-surface p-5">
          <p className="text-sm text-muted">
            Este espacio se llenará cuando haya más datos de tu operación.
          </p>
        </article>
      </section>

      <section className="min-h-48 rounded-xl border border-dashed border-border bg-surface p-5">
        <p className="text-sm text-muted">
          Aquí aparecerán las conversaciones recientes cuando el equipo de canales conecte la bandeja.
        </p>
      </section>
    </div>
  );
}
