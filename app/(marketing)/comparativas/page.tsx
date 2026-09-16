export default function ComparativasPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Borrador · Comparativas</p>
      <h1 className="text-3xl font-semibold text-orbita-900">Órbita frente a otros</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-orbita-50/60 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Capacidad</th>
              <th className="px-4 py-3 font-medium">Órbita</th>
              <th className="px-4 py-3 font-medium">Kommo / similares</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Usuarios</td>
              <td className="px-4 py-3">Ilimitados</td>
              <td className="px-4 py-3">Por asiento</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Agente que ejecuta CRM</td>
              <td className="px-4 py-3">Sí</td>
              <td className="px-4 py-3">Respuestas, pocas acciones</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-3">Cobro</td>
              <td className="px-4 py-3">Consumo</td>
              <td className="px-4 py-3">Licencia</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">Tabla placeholder. Sustituir con la matriz de marketing.</p>
    </div>
  );
}
