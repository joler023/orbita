import type { AgentTone } from "@/lib/api/ai-agents";

export function formatConversationCount(count: number): string {
  const formatted = new Intl.NumberFormat("es-CO").format(count);
  return count === 1 ? `${formatted} conversación en 30 días` : `${formatted} conversaciones en 30 días`;
}

export function formatAgentsMeta(total: number, active: number): string {
  const agents = total === 1 ? "1 asistente" : `${total} asistentes`;
  const actives = active === 1 ? "1 activo" : `${active} activos`;
  return `${agents} · ${actives}`;
}

export const TONE_OPTIONS: ReadonlyArray<{ value: AgentTone; title: string; description: string }> = [
  {
    value: "Formal",
    title: "Muy formal",
    description: "Se ciñe a lo que le indicaste. Ideal para precios o temas delicados.",
  },
  {
    value: "Balanced",
    title: "Equilibrado",
    description: "Habla natural, pero no se sale de lo que le dijiste.",
  },
  {
    value: "Conversational",
    title: "Conversador",
    description: "Más cálido y conversador. A veces se extiende un poco más.",
  },
];
