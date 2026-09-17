import type { AiTool } from "@/lib/api/ai-agents";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgentToolsFields } from "./agent-tools-fields";

const catalog: AiTool[] = [
  {
    key: "consultar_conocimiento",
    displayName: "Consultar los documentos del negocio",
    description: "Busca la respuesta en los documentos que subiste.",
    isAvailable: true,
    unavailableReason: null,
    resultsIn: null,
  },
  {
    key: "crear_oportunidad",
    displayName: "Registrar una oportunidad de venta",
    description: "Crea una oportunidad en el tablero.",
    isAvailable: true,
    unavailableReason: null,
    resultsIn: "pipeline",
  },
  {
    key: "agendar_cita",
    displayName: "Agendar una cita",
    description: "Reserva un espacio en la agenda.",
    isAvailable: false,
    unavailableReason: "Disponible cuando se active el módulo de oportunidades.",
    resultsIn: null,
  },
];

describe("AgentToolsFields", () => {
  it("sends the full set when a tool is turned on or off", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<AgentToolsFields catalog={catalog} selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: /Consultar los documentos/ }));
    expect(onChange).toHaveBeenLastCalledWith(["consultar_conocimiento"]);

    rerender(<AgentToolsFields catalog={catalog} selected={["consultar_conocimiento"]} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox", { name: /Consultar los documentos/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("keeps unavailable tools disabled and says why", () => {
    render(<AgentToolsFields catalog={catalog} selected={[]} onChange={vi.fn()} />);

    const tool = screen.getByRole("checkbox", { name: /Agendar una cita/ });
    expect(tool).toBeDisabled();
    expect(tool).toHaveAccessibleDescription("Disponible cuando se active el módulo de oportunidades.");
  });

  it("warns that a tool's results land somewhere the owner cannot open yet", () => {
    render(<AgentToolsFields catalog={catalog} selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /Registrar una oportunidad/ })).toHaveAccessibleDescription(
      "Crea una oportunidad en el tablero. Lo que registre aparece en Pipeline, que todavía no puedes abrir desde el panel.",
    );
  });

  it("says nothing extra for a tool that leaves nothing to look at", () => {
    render(<AgentToolsFields catalog={catalog} selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /Consultar los documentos/ })).toHaveAccessibleDescription(
      "Busca la respuesta en los documentos que subiste.",
    );
  });
});
