import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "./table";

describe("Table", () => {
  it("renders column headers and a row", () => {
    render(
      <Table
        caption="Contactos"
        columns={[
          { key: "name", header: "Contacto" },
          { key: "channel", header: "Canal" },
        ]}
      >
        <tr>
          <td className="px-4 py-3">Laura Mejía</td>
          <td className="px-4 py-3">WhatsApp</td>
        </tr>
      </Table>,
    );

    expect(screen.getByRole("columnheader", { name: "Contacto" })).toBeInTheDocument();
    expect(screen.getByText("Laura Mejía")).toBeInTheDocument();
  });
});
