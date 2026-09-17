import { ToastProvider } from "@/components/ui/toast";
import type { AiProvider, ModelPreference } from "@/lib/api/ai-models";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelPreferencesPanel } from "./model-preferences-panel";

const listAiProviders = vi.fn();
const listModelPreferences = vi.fn();
const setModelPreference = vi.fn();
const clearModelPreference = vi.fn();

vi.mock("@/lib/api/ai-models", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-models")>();
  return {
    ...actual,
    listAiProviders: (...args: unknown[]) => listAiProviders(...args),
    listModelPreferences: (...args: unknown[]) => listModelPreferences(...args),
    setModelPreference: (...args: unknown[]) => setModelPreference(...args),
    clearModelPreference: (...args: unknown[]) => clearModelPreference(...args),
  };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

const providers: AiProvider[] = [
  { name: "openai-compatible", displayName: "OpenRouter", isConfigured: true, isPrimary: true },
  { name: "ollama", displayName: "Ollama", isConfigured: false, isPrimary: false },
];

const defaults: ModelPreference[] = [
  { task: "Classify", model: "deepseek/deepseek-v4-flash", isTenantOverride: false },
  { task: "Draft", model: "openai/gpt-5.6-luna", isTenantOverride: false },
  { task: "Embed", model: "openai/text-embedding-3-small", isTenantOverride: false },
];

function renderPanel() {
  render(
    <ToastProvider>
      <ModelPreferencesPanel tenantId={tenantId} />
    </ToastProvider>,
  );
}

/** Waits for the list to load: the rows only exist after the first request resolves. */
async function rowFor(title: string) {
  return (await screen.findByText(title)).closest("li") as HTMLElement;
}

describe("ModelPreferencesPanel", () => {
  beforeEach(() => {
    listAiProviders.mockReset().mockResolvedValue(providers);
    listModelPreferences.mockReset().mockResolvedValue(defaults);
    setModelPreference.mockReset();
    clearModelPreference.mockReset().mockResolvedValue(undefined);
  });

  it("explains the trade-off the story is about, in the owner's terms", async () => {
    renderPanel();

    expect(await screen.findByText(/uno económico para entender el mensaje/i)).toBeInTheDocument();
  });

  it("shows the three tasks with the model each one uses", async () => {
    renderPanel();

    expect(await screen.findByDisplayValue("deepseek/deepseek-v4-flash")).toBeInTheDocument();
    expect(screen.getByDisplayValue("openai/gpt-5.6-luna")).toBeInTheDocument();
    expect(screen.getByDisplayValue("openai/text-embedding-3-small")).toBeInTheDocument();
  });

  it("separates what the organization chose from what comes by default", async () => {
    listModelPreferences.mockResolvedValue([
      { ...defaults[0], model: "otro/modelo", isTenantOverride: true },
      defaults[1],
      defaults[2],
    ]);
    renderPanel();

    const classify = await rowFor("Entender de qué se trata");
    expect(within(classify).getByText("Lo elegiste tú")).toBeInTheDocument();
    expect(within(await rowFor("Escribir la respuesta")).getByText("El de por defecto")).toBeInTheDocument();
  });

  it("keeps the save button off until the model changes", async () => {
    const user = userEvent.setup();
    renderPanel();

    const draft = await rowFor("Escribir la respuesta");
    expect(within(draft).getByRole("button", { name: "Guardar" })).toBeDisabled();

    await user.type(within(draft).getByRole("textbox"), "-preview");

    expect(within(draft).getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("saves the model for one task only", async () => {
    const user = userEvent.setup();
    setModelPreference.mockResolvedValue({ task: "Draft", model: "otro/modelo", isTenantOverride: true });
    renderPanel();

    const draft = await rowFor("Escribir la respuesta");
    const field = within(draft).getByRole("textbox");
    await user.clear(field);
    await user.type(field, "otro/modelo");
    await user.click(within(draft).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(setModelPreference).toHaveBeenCalledWith(tenantId, "openai-compatible", "Draft", "otro/modelo"));
    expect(
      await screen.findByText("Guardamos el cambio. Tu asistente lo usa en la próxima respuesta."),
    ).toBeInTheDocument();
  });

  it("refuses an empty model and never calls the API", async () => {
    const user = userEvent.setup();
    renderPanel();

    const draft = await rowFor("Escribir la respuesta");
    await user.clear(within(draft).getByRole("textbox"));
    await user.click(within(draft).getByRole("button", { name: "Guardar" }));

    expect(
      await within(draft).findByText("Escribe el identificador del modelo, o vuelve al de por defecto."),
    ).toBeInTheDocument();
    expect(setModelPreference).not.toHaveBeenCalled();
  });

  it("offers going back to the default only where the organization chose one", async () => {
    listModelPreferences.mockResolvedValue([
      { ...defaults[0], model: "otro/modelo", isTenantOverride: true },
      defaults[1],
      defaults[2],
    ]);
    renderPanel();

    const classify = await rowFor("Entender de qué se trata");
    expect(within(classify).getByRole("button", { name: /Volver al de por defecto/ })).toBeInTheDocument();
    expect(
      within(await rowFor("Escribir la respuesta")).queryByRole("button", { name: /Volver al de por defecto/ }),
    ).not.toBeInTheDocument();
  });

  it("clears the override and re-reads what the default now is", async () => {
    const user = userEvent.setup();
    listModelPreferences
      .mockResolvedValueOnce([
        { ...defaults[0], model: "otro/modelo", isTenantOverride: true },
        defaults[1],
        defaults[2],
      ])
      .mockResolvedValueOnce(defaults);
    renderPanel();

    const classify = await rowFor("Entender de qué se trata");
    await user.click(within(classify).getByRole("button", { name: /Volver al de por defecto/ }));

    await waitFor(() => expect(clearModelPreference).toHaveBeenCalledWith(tenantId, "openai-compatible", "Classify"));
    expect(await screen.findByDisplayValue("deepseek/deepseek-v4-flash")).toBeInTheDocument();
  });

  it("warns that a wrong id only shows up on the next answer", async () => {
    renderPanel();

    expect(await screen.findByText(/dejará de responder en la siguiente/i)).toBeInTheDocument();
  });

  it("edits the provider answering today, named, not a hardcoded one", async () => {
    renderPanel();

    expect(await screen.findByText("OpenRouter")).toBeInTheDocument();
    await waitFor(() => expect(listModelPreferences).toHaveBeenCalledWith(tenantId, "openai-compatible"));
  });

  it("skips a provider that is listed first but not configured", async () => {
    listAiProviders.mockResolvedValue([
      { name: "ollama", displayName: "Ollama", isConfigured: false, isPrimary: false },
      { name: "openai-compatible", displayName: "OpenRouter", isConfigured: true, isPrimary: true },
    ]);
    renderPanel();

    await waitFor(() => expect(listModelPreferences).toHaveBeenCalledWith(tenantId, "openai-compatible"));
  });

  it("says plainly when no provider is connected, instead of an empty form", async () => {
    listAiProviders.mockResolvedValue([
      { name: "ollama", displayName: "Ollama", isConfigured: false, isPrimary: false },
    ]);
    renderPanel();

    expect(await screen.findByText("No hay ningún proveedor de IA conectado")).toBeInTheDocument();
    expect(listModelPreferences).not.toHaveBeenCalled();
  });

  it("offers a retry when the section cannot be read", async () => {
    listModelPreferences.mockRejectedValue(new Error("network"));
    renderPanel();

    expect(await screen.findByText("No pudimos cargar esta sección")).toBeInTheDocument();
  });
});
