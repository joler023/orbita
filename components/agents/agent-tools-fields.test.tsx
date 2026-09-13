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
  },
  {
    key: "crear_oportunidad",
    displayName: "Registrar una oportunidad de venta",
    description: "Crea una oportunidad en el tablero.",
    isAvailable: false,
    unavailableReason: "Disponible cuando se active el módulo de oportunidades.",
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

    const tool = screen.getByRole("checkbox", { name: /Registrar una oportunidad/ });
    expect(tool).toBeDisabled();
    expect(tool).toHaveAccessibleDescription("Disponible cuando se active el módulo de oportunidades.");
  });
});
