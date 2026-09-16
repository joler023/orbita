import type { EnergyLevel, FormalityLevel, VerbosityLevel } from "@/lib/api/ai-agents";
import { ENERGY_LEVELS, FORMALITY_LEVELS, VERBOSITY_LEVELS } from "@/lib/api/ai-agents";

export function formatConversationCount(count: number): string {
  const formatted = new Intl.NumberFormat("es-CO").format(count);
  return count === 1 ? `${formatted} conversación en 30 días` : `${formatted} conversaciones en 30 días`;
}

export function formatAgentsMeta(total: number, active: number): string {
  const agents = total === 1 ? "1 asistente" : `${total} asistentes`;
  const actives = active === 1 ? "1 activo" : `${active} activos`;
  return `${agents} · ${actives}`;
}

/**
 * Where a tool's work shows up, and whether that screen exists in the dashboard yet. The API
 * says which module (`resultsIn`); which modules are still placeholders is ours to know, so
 * this is the single place to flip when one of them ships.
 */
const TOOL_DESTINATIONS: Record<string, { label: string; ready: boolean }> = {
  pipeline: { label: "Pipeline", ready: false },
};

export function describeToolResult(resultsIn: string | null): string | null {
  if (!resultsIn) {
    return null;
  }
  const destination = TOOL_DESTINATIONS[resultsIn];
  if (!destination) {
    return null;
  }
  return destination.ready
    ? `Lo que registre aparece en ${destination.label}.`
    : `Lo que registre aparece en ${destination.label}, que todavía no puedes abrir desde el panel.`;
}

export type StyleAxis<T extends string> = {
  levels: readonly [T, T, T];
  startLabel: string;
  endLabel: string;
  levelLabels: readonly [string, string, string];
};

export const FORMALITY_AXIS: StyleAxis<FormalityLevel> = {
  levels: FORMALITY_LEVELS,
  startLabel: "Formal",
  endLabel: "Cercano",
  levelLabels: ["Formal", "Equilibrado", "Cercano"],
};

export const VERBOSITY_AXIS: StyleAxis<VerbosityLevel> = {
  levels: VERBOSITY_LEVELS,
  startLabel: "Breve",
  endLabel: "Detallado",
  levelLabels: ["Breve", "Equilibrado", "Detallado"],
};

export const ENERGY_AXIS: StyleAxis<EnergyLevel> = {
  levels: ENERGY_LEVELS,
  startLabel: "Neutro",
  endLabel: "Entusiasta",
  levelLabels: ["Neutro", "Equilibrado", "Entusiasta"],
};
