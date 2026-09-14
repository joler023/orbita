import type { SaveAiAgentRequest } from "@/lib/api/ai-agents";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { emptyAgentDraft } from "./agent-draft";
import { AgentInstructionsFields } from "./agent-instructions-fields";

function Harness({ errors = {} }: { errors?: Record<string, string> }) {
  const [draft, setDraft] = useState<SaveAiAgentRequest>(emptyAgentDraft());
  return (
    <>
      <AgentInstructionsFields
        draft={draft}
        errors={errors}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      />
      <output data-testid="draft">{JSON.stringify(draft)}</output>
    </>
  );
}

function currentDraft(): SaveAiAgentRequest {
  return JSON.parse(screen.getByTestId("draft").textContent ?? "{}") as SaveAiAgentRequest;
}

describe("AgentInstructionsFields", () => {
  it("edits name, personality and instructions", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("¿Cómo se llama tu asistente?"), "Aura");
    await user.type(screen.getByLabelText("¿Cómo habla?"), "Cercana");
    await user.type(screen.getByLabelText("¿Qué hace y qué nunca debe hacer?"), "Atiende pedidos");

    expect(currentDraft()).toMatchObject({
      name: "Aura",
      personality: "Cercana",
      instructions: "Atiende pedidos",
    });
  });

  it("moves each style axis on its own", () => {
    render(<Harness />);

    const [formality, verbosity, energy] = screen.getAllByRole("slider");
    fireEvent.change(formality, { target: { value: "2" } });
    fireEvent.change(verbosity, { target: { value: "0" } });
    fireEvent.change(energy, { target: { value: "2" } });

    expect(currentDraft().style).toEqual({
      formality: "Warm",
      verbosity: "Brief",
      energy: "Enthusiastic",
    });
  });

  it("fills the instructions from an example", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Ver ejemplos para inspirarte"));
    await user.click(screen.getByRole("button", { name: "Usar el ejemplo de Consultorio" }));

    expect(currentDraft().instructions).toMatch(/^Eres el asistente de un consultorio/);
  });

  it("shows field errors", () => {
    render(<Harness errors={{ name: "Ponle un nombre a tu asistente." }} />);

    expect(screen.getByLabelText("¿Cómo se llama tu asistente?")).toHaveAccessibleDescription(
      "Ponle un nombre a tu asistente.",
    );
  });

  it("never shows model jargon", () => {
    const { container } = render(<Harness />);

    expect(container.textContent).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
