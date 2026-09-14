import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  it("links the vector wordmark by default", () => {
    render(<Logo href="/t/tenant-1/inicio" />);

    const image = screen.getByRole("img", { name: "Órbita" });
    expect(image.getAttribute("src")).toContain("orbita-wordmark.svg");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/t/tenant-1/inicio");
  });

  it("uses the white version for dark surfaces", () => {
    render(<Logo variant="white" />);

    expect(screen.getByRole("img", { name: "Órbita" }).getAttribute("src")).toContain("orbita-logo-white.png");
  });

  it("never renders below the manual's minimum width", () => {
    render(<Logo width={60} />);

    expect(screen.getByRole("img", { name: "Órbita" })).toHaveAttribute("width", "140");
  });
});
