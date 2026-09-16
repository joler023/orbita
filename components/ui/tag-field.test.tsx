import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { TagField, type TagFieldProps } from "./tag-field";

function Harness({ initial = [], ...props }: Partial<TagFieldProps> & { initial?: string[] }) {
  const [value, setValue] = useState(initial);
  return <TagField label="Temas" value={value} onChange={setValue} {...props} />;
}

describe("TagField", () => {
  it("adds an entry with Enter and keeps what the person typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Temas"), "Diagnóstico{Enter}");

    expect(screen.getByText("Diagnóstico")).toBeInTheDocument();
    expect(screen.getByLabelText("Temas")).toHaveValue("");
  });

  it("adds an entry with a comma too", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Temas"), "dosis,");

    expect(screen.getByText("dosis")).toBeInTheDocument();
  });

  it("trims blanks and ignores an empty entry", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagField label="Temas" value={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText("Temas"), "   {Enter}");
    expect(onChange).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Temas"), "  dosis  {Enter}");
    expect(onChange).toHaveBeenCalledWith(["dosis"]);
  });

  it("does not add the same entry twice, whatever the casing", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["dosis"]} />);

    await user.type(screen.getByLabelText("Temas"), "DOSIS{Enter}");

    expect(screen.getAllByText(/dosis/i)).toHaveLength(1);
  });

  it("removes an entry from its own button", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["dosis", "descuento"]} />);

    await user.click(screen.getByRole("button", { name: "Quitar dosis" }));

    expect(screen.queryByText("dosis")).not.toBeInTheDocument();
    expect(screen.getByText("descuento")).toBeInTheDocument();
  });

  it("removes the last entry with Backspace on an empty field", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["dosis", "descuento"]} />);

    await user.type(screen.getByLabelText("Temas"), "{Backspace}");

    expect(screen.queryByText("descuento")).not.toBeInTheDocument();
    expect(screen.getByText("dosis")).toBeInTheDocument();
  });

  it("stops accepting entries once the maximum is reached", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["dosis"]} maxTags={1} />);

    const field = screen.getByLabelText("Temas");
    expect(field).toBeDisabled();
    expect(screen.getByText("1 de 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar dosis" }));
    expect(screen.getByLabelText("Temas")).toBeEnabled();
  });

  it("cannot type an entry longer than the limit", () => {
    render(<Harness maxTagLength={120} />);

    expect(screen.getByLabelText("Temas")).toHaveAttribute("maxlength", "120");
  });

  it("wires the error to the field for screen readers", () => {
    render(<TagField id="temas" label="Temas" value={[]} onChange={vi.fn()} error="Falta algo" />);

    const field = screen.getByLabelText("Temas");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Falta algo");
  });
});
