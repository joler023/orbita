import type { AiAgent } from "@/lib/api/ai-agents";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AgentList } from "./agent-list";

function agent(overrides: Partial<AiAgent>): AiAgent {
  return {
    id: "a1",
    name: "Aura",
    personality: "",
    instructions: "",
    style: { formality: "Balanced", verbosity: "Balanced", energy: "Balanced" },
    hasUnpublishedChanges: false,
    draft: null,
    tools: [],
    isEnabled: true,
    conversationCount: 0,
    createdAt: "2026-09-11T12:00:00+00:00",
    ...overrides,
  };
}

describe("AgentList", () => {
  it("shows each agent's state in words and marks the selected one", () => {
    render(
      <AgentList
        agents={[agent({}), agent({ id: "a2", name: "Nova", isEnabled: false, conversationCount: 12 })]}
        selectedId="a2"
        onSelect={vi.fn()}
      />,
    );

    const aura = screen.getByRole("button", { name: /Aura/ });
    const nova = screen.getByRole("button", { name: /Nova/ });
    expect(aura).toHaveTextContent("Activo");
    expect(nova).toHaveTextContent("Pausado");
    expect(nova).toHaveTextContent("12 conversaciones en 30 días");
    expect(nova).toHaveAttribute("aria-current", "true");
    expect(aura).not.toHaveAttribute("aria-current");
  });

  it("selects an agent on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AgentList agents={[agent({})]} selectedId={null} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /Aura/ }));
    expect(onSelect).toHaveBeenCalledWith("a1");
  });
});
