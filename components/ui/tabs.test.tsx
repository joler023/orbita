import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./tabs";

const items = [
  { value: "one", label: "Instrucciones" },
  { value: "two", label: "Herramientas" },
  { value: "three", label: "Conocimiento" },
] as const;

type Value = (typeof items)[number]["value"];

function Harness() {
  const [value, setValue] = useState<Value>("one");
  return (
    <Tabs label="Secciones del agente" items={items} value={value} onChange={setValue}>
      <p>Panel {value}</p>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the panel of the selected tab and switches on click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole("tab", { name: "Instrucciones" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Instrucciones" })).toHaveTextContent("Panel one");

    await user.click(screen.getByRole("tab", { name: "Herramientas" }));
    expect(screen.getByRole("tabpanel", { name: "Herramientas" })).toHaveTextContent("Panel two");
  });

  it("moves between tabs with the arrow keys and wraps around", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    const last = screen.getByRole("tab", { name: "Conocimiento" });
    expect(last).toHaveAttribute("aria-selected", "true");
    expect(last).toHaveFocus();
  });
});
