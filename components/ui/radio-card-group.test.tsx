import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioCardGroup } from "./radio-card-group";

const options = [
  { value: "a", title: "Muy formal", description: "Trato de usted" },
  { value: "b", title: "Equilibrado" },
] as const;

describe("RadioCardGroup", () => {
  it("marks the selected option inside a named group", () => {
    render(
      <RadioCardGroup name="tone" legend="Tono" options={options} value="b" onChange={vi.fn()} />,
    );

    expect(screen.getByRole("group", { name: "Tono" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Equilibrado" })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Muy formal/ })).not.toBeChecked();
  });

  it("reports the typed value of the clicked option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioCardGroup name="tone" legend="Tono" options={options} value="b" onChange={onChange} />,
    );

    await user.click(screen.getByText("Trato de usted"));
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
