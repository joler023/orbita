import { ToastProvider } from "@/components/ui/toast";
import type { AiAgent } from "@/lib/api/ai-agents";
import type { RoutingRule } from "@/lib/api/routing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoutingRulesPanel } from "./routing-rules-panel";

const listRoutingRules = vi.fn();
const saveRoutingRules = vi.fn();

vi.mock("@/lib/api/routing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/routing")>();
  return {
    ...actual,
    listRoutingRules: (...args: unknown[]) => listRoutingRules(...args),
    saveRoutingRules: (...args: unknown[]) => saveRoutingRules(...args),
  };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

const agents = [
  { id: "a1", name: "Aura" },
  { id: "a2", name: "Nova" },
] as AiAgent[];

function rule(overrides: Partial<RoutingRule> = {}): RoutingRule {
  return { name: "Pedidos", channel: "WhatsApp", keyword: null, agentId: "a1", ...overrides };
}

function renderPanel() {
  render(
    <ToastProvider>
      <RoutingRulesPanel tenantId={tenantId} agents={agents} />
    </ToastProvider>,
  );
}

describe("RoutingRulesPanel", () => {
  beforeEach(() => {
    listRoutingRules.mockReset().mockResolvedValue([]);
    saveRoutingRules.mockReset();
  });

  it("explains that the first match wins, which is the whole point of the order", async () => {
    renderPanel();

    expect(await screen.findByText(/gana la primera que coincida/)).toBeInTheDocument();
  });

  it("says plainly that with no rules everything reaches the team", async () => {
    renderPanel();

    expect(
      await screen.findByText(/todas las conversaciones llegan a tu equipo/i),
    ).toBeInTheDocument();
  });

  it("numbers each rule so the evaluation order is visible", async () => {
    listRoutingRules.mockResolvedValue([rule({ name: "Primera" }), rule({ name: "Segunda" })]);
    renderPanel();

    expect(await screen.findByLabelText("Nombre de la regla 1")).toHaveValue("Primera");
    expect(screen.getByLabelText("Nombre de la regla 2")).toHaveValue("Segunda");
  });

  it("moves a rule down and keeps the new order when saving", async () => {
    const user = userEvent.setup();
    const first = rule({ name: "Primera" });
    const second = rule({ name: "Segunda" });
    listRoutingRules.mockResolvedValue([first, second]);
    saveRoutingRules.mockResolvedValue([second, first]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Bajar la regla 1" }));

    expect(screen.getByLabelText("Nombre de la regla 1")).toHaveValue("Segunda");

    await user.click(screen.getByRole("button", { name: "Guardar reglas" }));

    await waitFor(() =>
      expect(saveRoutingRules).toHaveBeenCalledWith(tenantId, [second, first]),
    );
  });

  it("cannot move the first rule up nor the last one down", async () => {
    listRoutingRules.mockResolvedValue([rule(), rule({ name: "Segunda" })]);
    renderPanel();

    expect(await screen.findByRole("button", { name: "Subir la regla 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bajar la regla 2" })).toBeDisabled();
  });

  it("warns about a rule that swallows every conversation below it", async () => {
    listRoutingRules.mockResolvedValue([
      rule({ name: "Todo", channel: null, keyword: null }),
      rule({ name: "Nunca se lee" }),
    ]);
    renderPanel();

    expect(await screen.findByText(/las de abajo nunca se revisan/i)).toBeInTheDocument();
  });

  it("does not warn when the catch-all sits last, where it belongs", async () => {
    listRoutingRules.mockResolvedValue([
      rule(),
      rule({ name: "Todo lo demás", channel: null, keyword: null }),
    ]);
    renderPanel();

    await screen.findByLabelText("Nombre de la regla 1");
    expect(screen.queryByText(/nunca se revisan/i)).not.toBeInTheDocument();
  });

  it("adds a rule and lets the team take it instead of an assistant", async () => {
    const user = userEvent.setup();
    saveRoutingRules.mockResolvedValue([]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Agregar regla" }));
    await user.type(screen.getByLabelText("Nombre de la regla 1"), "Reclamos");
    await user.selectOptions(screen.getByLabelText("La atiende"), "team");
    await user.click(screen.getByRole("button", { name: "Guardar reglas" }));

    await waitFor(() =>
      expect(saveRoutingRules).toHaveBeenCalledWith(tenantId, [
        { name: "Reclamos", channel: null, keyword: null, agentId: null },
      ]),
    );
  });

  it("refuses to save a rule with no name and never calls the API", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Agregar regla" }));
    await user.click(screen.getByRole("button", { name: "Guardar reglas" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ponle un nombre a la regla 1, para saber qué hace sin abrirla.",
    );
    expect(saveRoutingRules).not.toHaveBeenCalled();
  });

  it("offers a retry when the rules cannot be read", async () => {
    listRoutingRules.mockRejectedValue(new Error("network"));
    renderPanel();

    expect(await screen.findByText("No pudimos cargar las reglas")).toBeInTheDocument();
  });

  it("never shows model jargon", async () => {
    listRoutingRules.mockResolvedValue([rule()]);
    const { container } = render(
      <ToastProvider>
        <RoutingRulesPanel tenantId={tenantId} agents={agents} />
      </ToastProvider>,
    );

    await screen.findAllByLabelText("Nombre de la regla 1");
    expect(container.textContent).not.toMatch(/prompt|temperatura|modelo|tokens|enrutador/i);
  });
});
