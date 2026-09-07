import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineWorkspace } from "./pipeline-workspace";

const { listPipelines, createStage, deleteStage } = vi.hoisted(() => ({
  listPipelines: vi.fn(),
  createStage: vi.fn(),
  deleteStage: vi.fn(),
}));

vi.mock("@/lib/api/pipelines", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/pipelines")>("@/lib/api/pipelines");
  return {
    ...actual,
    listPipelines: (...args: unknown[]) => listPipelines(...args),
    createStage: (...args: unknown[]) => createStage(...args),
    deleteStage: (...args: unknown[]) => deleteStage(...args),
  };
});

const defaultPipeline = {
  id: "pipe-1",
  name: "Ventas",
  isDefault: true,
  stages: [
    { id: "s1", name: "Nuevo", sortOrder: 0, isWon: false, isLost: false },
    { id: "s2", name: "Ganada", sortOrder: 1, isWon: true, isLost: false },
    { id: "s3", name: "Perdida", sortOrder: 2, isWon: false, isLost: true },
  ],
};

describe("PipelineWorkspace", () => {
  beforeEach(() => {
    listPipelines.mockReset();
    createStage.mockReset();
    deleteStage.mockReset();
    listPipelines.mockResolvedValue([defaultPipeline]);
  });

  it("renders the default sales stages", async () => {
    render(
      <ToastProvider>
        <PipelineWorkspace tenantId="tenant-1" />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Nuevo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ganada" })).toBeInTheDocument();
    expect(screen.getByText("Ganada", { selector: "p" })).toBeInTheDocument();
  });

  it("asks where to move deals before deleting a stage", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <PipelineWorkspace tenantId="tenant-1" />
      </ToastProvider>,
    );

    await screen.findByRole("heading", { name: "Nuevo" });
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);

    expect(await screen.findByRole("heading", { name: "Eliminar etapa" })).toBeInTheDocument();
    expect(screen.getByText("Mover oportunidades a")).toBeInTheDocument();
  });
});
