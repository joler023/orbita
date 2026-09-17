import { ToastProvider } from "@/components/ui/toast";
import type { AiAgent, BusinessHours } from "@/lib/api/ai-agents";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentSchedulePanel } from "./agent-schedule-panel";

const saveBusinessHours = vi.fn();

vi.mock("@/lib/api/ai-agents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-agents")>();
  return { ...actual, saveBusinessHours: (...args: unknown[]) => saveBusinessHours(...args) };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

const splitMonday: BusinessHours = {
  slots: [
    { day: "Monday", opens: "08:00:00", closes: "12:00:00" },
    { day: "Monday", opens: "14:00:00", closes: "18:00:00" },
  ],
  outsideHours: "AssistantAnswers",
};

function renderPanel(businessHours: BusinessHours | null = null) {
  const onSaved = vi.fn();
  render(
    <ToastProvider>
      <AgentSchedulePanel
        tenantId={tenantId}
        agentId="a1"
        businessHours={businessHours}
        onSaved={onSaved}
      />
    </ToastProvider>,
  );
  return { onSaved };
}

describe("AgentSchedulePanel", () => {
  beforeEach(() => {
    saveBusinessHours.mockReset();
    saveBusinessHours.mockResolvedValue({ id: "a1" } as AiAgent);
  });

  it("offers the two choices the design guide asks for, both reachable", () => {
    renderPanel();

    expect(screen.getByRole("group", { name: "¿Cuándo trabaja?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Siempre/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Solo fuera del horario laboral/ })).toBeEnabled();
  });

  it("says the schedule applies without publishing", () => {
    renderPanel();

    expect(screen.getByText(/empieza a regir apenas lo guardes/i)).toBeInTheDocument();
  });

  it("keeps the week out of sight while the assistant works around the clock", () => {
    renderPanel();

    expect(screen.queryByText("Tu horario laboral")).not.toBeInTheDocument();
  });

  it("sends null when the owner wants the assistant on duty at all hours", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderPanel(splitMonday);

    await user.click(screen.getByRole("radio", { name: /Siempre/ }));
    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    await waitFor(() => expect(saveBusinessHours).toHaveBeenCalledWith(tenantId, "a1", null));
    expect(onSaved).toHaveBeenCalled();
  });

  it("offers a working week instead of an empty one when the schedule is new", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("radio", { name: /Solo fuera del horario laboral/ }));

    expect(screen.getByLabelText("Lunes: abre")).toHaveValue("09:00");
    expect(screen.getByLabelText("Viernes: cierra")).toHaveValue("18:00");
    // Saturday and Sunday, the two days the default week leaves to the assistant.
    expect(screen.getAllByText("Cerrado")).toHaveLength(2);
  });

  it("keeps a split shift instead of silently dropping the second stretch", async () => {
    const user = userEvent.setup();
    renderPanel(splitMonday);

    expect(screen.getAllByLabelText("Lunes: abre")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    await waitFor(() =>
      expect(saveBusinessHours).toHaveBeenCalledWith(tenantId, "a1", {
        slots: splitMonday.slots,
        outsideHours: "AssistantAnswers",
      }),
    );
  });

  it("adds and removes a stretch of a day", async () => {
    const user = userEvent.setup();
    renderPanel(splitMonday);

    await user.click(screen.getByRole("button", { name: "Agregar franja el martes" }));
    expect(screen.getByLabelText("Martes: abre")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Quitar la franja de lunes" })[0]);
    expect(screen.getAllByLabelText("Lunes: abre")).toHaveLength(1);
  });

  it("edits a time and sends it with the seconds the API expects", async () => {
    const user = userEvent.setup();
    renderPanel({ slots: [splitMonday.slots[0]], outsideHours: "AssistantAnswers" });

    await user.clear(screen.getByLabelText("Lunes: abre"));
    await user.type(screen.getByLabelText("Lunes: abre"), "07:30");
    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    await waitFor(() =>
      expect(saveBusinessHours).toHaveBeenCalledWith(tenantId, "a1", {
        slots: [{ day: "Monday", opens: "07:30:00", closes: "12:00:00" }],
        outsideHours: "AssistantAnswers",
      }),
    );
  });

  it("refuses a week with no hours and points at the pause switch", async () => {
    const user = userEvent.setup();
    renderPanel({ slots: [splitMonday.slots[0]], outsideHours: "AssistantAnswers" });

    await user.click(screen.getByRole("button", { name: "Quitar la franja de lunes" }));
    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/pausa el asistente/i);
    expect(saveBusinessHours).not.toHaveBeenCalled();
  });

  it("refuses a stretch that crosses midnight and never calls the API", async () => {
    const user = userEvent.setup();
    renderPanel({
      slots: [{ day: "Friday", opens: "22:00:00", closes: "23:00:00" }],
      outsideHours: "AssistantAnswers",
    });

    await user.clear(screen.getByLabelText("Viernes: cierra"));
    await user.type(screen.getByLabelText("Viernes: cierra"), "02:00");
    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/una franja para cada día/);
    expect(saveBusinessHours).not.toHaveBeenCalled();
  });

  it("shows the failure in Spanish and keeps the week the owner typed", async () => {
    const user = userEvent.setup();
    saveBusinessHours.mockRejectedValue(new Error("network"));
    renderPanel(splitMonday);

    await user.click(screen.getByRole("button", { name: "Guardar horario" }));

    expect(
      await screen.findByText("No pudimos conectar con el servidor. Revisa tu conexión."),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Lunes: abre")).toHaveLength(2);
  });

  it("never shows model jargon", () => {
    const { container } = render(
      <ToastProvider>
        <AgentSchedulePanel
          tenantId={tenantId}
          agentId="a1"
          businessHours={splitMonday}
          onSaved={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(container.textContent).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
