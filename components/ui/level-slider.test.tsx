import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LevelSlider } from "./level-slider";

const levels = ["Formal", "Balanced", "Warm"] as const;
const levelLabels = ["Formal", "Equilibrado", "Cercano"] as const;

function renderSlider(value: (typeof levels)[number], onChange = vi.fn()) {
  render(
    <LevelSlider
      levels={levels}
      value={value}
      onChange={onChange}
      startLabel="Formal"
      endLabel="Cercano"
      levelLabels={levelLabels}
    />,
  );
  return onChange;
}

describe("LevelSlider", () => {
  it("announces the level in words, not as a number", () => {
    renderSlider("Warm");

    const slider = screen.getByRole("slider", { name: "Formal" });
    expect(slider).toHaveAttribute("aria-valuetext", "Cercano");
    expect(slider).toHaveValue("2");
  });

  it("reports the level for the chosen position", () => {
    const onChange = renderSlider("Balanced");

    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });

    expect(onChange).toHaveBeenCalledWith("Formal");
  });

  // A native range input is what gives arrow-key support; jsdom does not simulate it.
  it("is a focusable native range with three stops", async () => {
    const user = userEvent.setup();
    renderSlider("Balanced");

    const slider = screen.getByRole("slider");
    await user.tab();

    expect(slider).toHaveFocus();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "2");
    expect(slider).toHaveAttribute("step", "1");
  });
});
