import { ToastProvider } from "@/components/ui/toast";
import type { SemanticCache } from "@/lib/api/ai-agents";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { describeReuse, RepeatedAnswersPanel } from "./repeated-answers-panel";

const getSemanticCache = vi.fn();
const setSemanticCacheLevel = vi.fn();

vi.mock("@/lib/api/ai-agents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-agents")>();
  return {
    ...actual,
    getSemanticCache: (...args: unknown[]) => getSemanticCache(...args),
    setSemanticCacheLevel: (...args: unknown[]) => setSemanticCacheLevel(...args),
  };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

function cache(overrides: Partial<SemanticCache> = {}): SemanticCache {
  return { level: "Off", hits: 0, misses: 0, hitRate: null, ...overrides };
}

function renderPanel() {
  render(
    <ToastProvider>
      <RepeatedAnswersPanel tenantId={tenantId} agentId="a1" />
    </ToastProvider>,
  );
}

/** Built with the same formatter: ICU spaces the percent sign differently per environment. */
function percent(share: number): string {
  return new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 0 }).format(share);
}

describe("describeReuse", () => {
  it("does not read «nobody asked yet» as «it never works»", () => {
    expect(describeReuse(cache())).toBe(
      "Todavía nadie le ha preguntado lo suficiente como para medirlo.",
    );
  });

  it("says 0% when it really never reused anything", () => {
    expect(describeReuse(cache({ hits: 0, misses: 4, hitRate: 0 }))).toBe(
      `De 4 preguntas, 0 se respondieron con una respuesta que ya tenía (${percent(0)}).`,
    );
  });

  it("counts questions, not cache hits, so the number means something", () => {
    expect(describeReuse(cache({ hits: 3, misses: 9, hitRate: 0.25 }))).toBe(
      `De 12 preguntas, 3 se respondieron con una respuesta que ya tenía (${percent(0.25)}).`,
    );
  });

  it("keeps the singular readable", () => {
    expect(describeReuse(cache({ hits: 1, misses: 0, hitRate: 1 }))).toBe(
      `De 1 pregunta, 1 se respondió con una respuesta que ya tenía (${percent(1)}).`,
    );
  });
});

describe("RepeatedAnswersPanel", () => {
  beforeEach(() => {
    getSemanticCache.mockReset().mockResolvedValue(cache());
    setSemanticCacheLevel.mockReset();
  });

  it("explains the idea without naming a cache or a threshold", async () => {
    const { container } = render(
      <ToastProvider>
        <RepeatedAnswersPanel tenantId={tenantId} agentId="a1" />
      </ToastProvider>,
    );

    await screen.findByRole("group", { name: "¿Cuándo puede repetir una respuesta?" });
    expect(container.textContent).toMatch(/preguntan casi lo mismo/);
    expect(container.textContent).not.toMatch(/cach[eé]|umbral|similitud|prompt|modelo|tokens/i);
  });

  it("says the change applies without publishing", async () => {
    renderPanel();

    expect(await screen.findByText(/empieza a regir apenas lo guardes/i)).toBeInTheDocument();
  });

  it("starts on the level the API reports", async () => {
    getSemanticCache.mockResolvedValue(cache({ level: "Balanced" }));
    renderPanel();

    expect(await screen.findByRole("radio", { name: /Si se parece bastante/ })).toBeChecked();
  });

  it("keeps the save button off until the level changes", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(await screen.findByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Si se parece bastante/ }));

    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("sends the chosen level and reports what changed", async () => {
    const user = userEvent.setup();
    setSemanticCacheLevel.mockResolvedValue(cache({ level: "Conservative" }));
    renderPanel();

    await user.click(await screen.findByRole("radio", { name: /Solo si es casi igual/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(setSemanticCacheLevel).toHaveBeenCalledWith(tenantId, "a1", "Conservative"),
    );
    expect(
      await screen.findByText("Listo. Tu asistente puede reutilizar respuestas parecidas."),
    ).toBeInTheDocument();
  });

  it("says something different when the owner turns it off", async () => {
    const user = userEvent.setup();
    getSemanticCache.mockResolvedValue(cache({ level: "Balanced" }));
    setSemanticCacheLevel.mockResolvedValue(cache({ level: "Off" }));
    renderPanel();

    await user.click(await screen.findByRole("radio", { name: /Nunca/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Listo. Tu asistente piensa cada respuesta desde cero."),
    ).toBeInTheDocument();
  });

  it("promises that stale answers are dropped on their own", async () => {
    renderPanel();

    expect(await screen.findByText(/se borran solas cuando cambias tus documentos/i)).toBeInTheDocument();
  });

  it("offers a retry when the section cannot be read", async () => {
    getSemanticCache.mockRejectedValue(new Error("network"));
    renderPanel();

    expect(await screen.findByText("No pudimos cargar esta sección")).toBeInTheDocument();
  });
});
