import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    const el = container.firstElementChild;

    expect(el).toHaveAttribute("aria-hidden", "true");
  });
});
