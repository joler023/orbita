import { Button } from "@/components/ui/button";

export type InstructionExample = {
  business: string;
  text: string;
};

export const INSTRUCTION_EXAMPLES: ReadonlyArray<InstructionExample> = [
  {
    business: "Panadería",
    text: "Eres el asistente de una panadería. Atiendes pedidos para recoger o domicilio y confirmas la hora de entrega. Nunca das precios de mayoreo: si alguien los pide, pasas la conversación a una persona.",
  },
  {
    business: "Tienda de ropa",
    text: "Eres la asesora de una tienda de ropa. Ayudas a elegir talla y muestras lo que hay disponible. Nunca inventas precios ni existencias: siempre consultas los documentos. Si el cliente pide un cambio o devolución, pasas la conversación a una persona.",
  },
  {
    business: "Consultorio",
    text: "Eres el asistente de un consultorio. Respondes horarios, dirección y cómo prepararse para una cita. Nunca das consejos médicos ni diagnósticos: si preguntan por síntomas, recomiendas agendar con el especialista.",
  },
];

export type InstructionExamplesProps = {
  onUse: (text: string) => void;
};

export function InstructionExamples({ onUse }: InstructionExamplesProps) {
  return (
    <details className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">Ver ejemplos para inspirarte</summary>
      <ul className="mt-3 flex flex-col gap-3">
        {INSTRUCTION_EXAMPLES.map((example) => (
          <li key={example.business} className="flex flex-col gap-2 rounded-lg bg-surface p-3">
            <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">{example.business}</p>
            <p className="text-sm text-foreground">{example.text}</p>
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              aria-label={`Usar el ejemplo de ${example.business}`}
              onClick={() => onUse(example.text)}
            >
              Usar este ejemplo
            </Button>
          </li>
        ))}
      </ul>
    </details>
  );
}
