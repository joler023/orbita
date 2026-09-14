import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as icons from "./nav-icons";

const iconComponents = Object.entries(icons).filter(([name]) => name.startsWith("Icon"));

describe("figma icons", () => {
  it("exports every icon the navigation needs", () => {
    expect(iconComponents.map(([name]) => name)).toEqual([
      "IconHome",
      "IconInbox",
      "IconContacts",
      "IconPipeline",
      "IconSparkles",
      "IconChannels",
      "IconCampaigns",
      "IconReports",
      "IconSettings",
      "IconHelp",
      "IconNotifications",
      "IconSidebarCollapse",
    ]);
  });

  it("inherits the text color and hides itself from screen readers", () => {
    for (const [name, Icon] of iconComponents) {
      const { container, unmount } = render(<Icon />);
      const svg = container.querySelector("svg");

      expect(svg, name).not.toBeNull();
      expect(svg?.getAttribute("fill"), name).toBe("currentColor");
      expect(svg?.getAttribute("aria-hidden"), name).toBe("true");
      expect(svg?.querySelector("path"), name).not.toBeNull();
      unmount();
    }
  });

  it("lets callers size the icon through props", () => {
    const { container } = render(<icons.IconHome className="size-6" />);

    expect(container.querySelector("svg")).toHaveClass("size-6");
  });
});
