import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INSTRUCTION_EXAMPLES, InstructionExamples } from "./instruction-examples";

describe("InstructionExamples", () => {
  it("hands the chosen example to the form", async () => {
    const user = userEvent.setup();
    const onUse = vi.fn();
    render(<InstructionExamples onUse={onUse} />);

    await user.click(screen.getByText("Ver ejemplos para inspirarte"));
    await user.click(screen.getByRole("button", { name: "Usar el ejemplo de Panadería" }));

    expect(onUse).toHaveBeenCalledWith(INSTRUCTION_EXAMPLES[0]?.text);
  });

  it("never uses model jargon", () => {
    const copy = INSTRUCTION_EXAMPLES.map((example) => example.text).join(" ");
    expect(copy).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
