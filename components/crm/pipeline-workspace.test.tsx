import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineWorkspace } from "./pipeline-workspace";

const { listPipelines, getPipelineBoard, listTeamMembers, joinTenantGroup } = vi.hoisted(() => ({
  listPipelines: vi.fn(),
  getPipelineBoard: vi.fn(),
  listTeamMembers: vi.fn(),
  joinTenantGroup: vi.fn(),
}));

vi.mock("@/lib/api/pipelines", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/pipelines")>("@/lib/api/pipelines");
  return {
    ...actual,
    listPipelines: (...args: unknown[]) => listPipelines(...args),
  };
});

vi.mock("@/lib/api/opportunities", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/opportunities")>("@/lib/api/opportunities");
  return {
    ...actual,
    getPipelineBoard: (...args: unknown[]) => getPipelineBoard(...args),
  };
});

vi.mock("@/lib/api/team", () => ({
  listTeamMembers: (...args: unknown[]) => listTeamMembers(...args),
}));

vi.mock("@/lib/realtime/crm-hub", () => ({
  createCrmHubConnection: () => ({ stop: vi.fn(), on: vi.fn() }),
  subscribeToOpportunityChanges: vi.fn(),
  joinTenantGroup: (...args: unknown[]) => joinTenantGroup(...args),
}));

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

const defaultBoard = {
  pipelineId: "pipe-1",
  pipelineName: "Ventas",
  stages: [
    {
      id: "s1",
      name: "Nuevo",
      sortOrder: 0,
      isWon: false,
      isLost: false,
      amountSum: 1500,
      opportunities: [
        {
          id: "o1",
          pipelineId: "pipe-1",
          stageId: "s1",
          title: "Sitio web",
          amount: 1500,
          assignedToUserId: null,
          assignedToName: null,
          lastMoveEventId: null,
          createdAt: "2026-09-07T00:00:00Z",
        },
      ],
    },
    {
      id: "s2",
      name: "Ganada",
      sortOrder: 1,
      isWon: true,
      isLost: false,
      amountSum: 0,
      opportunities: [],
    },
    {
      id: "s3",
      name: "Perdida",
      sortOrder: 2,
      isWon: false,
      isLost: true,
      amountSum: 0,
      opportunities: [],
    },
  ],
};

describe("PipelineWorkspace", () => {
  beforeEach(() => {
    listPipelines.mockReset();
    getPipelineBoard.mockReset();
    listTeamMembers.mockReset();
    joinTenantGroup.mockReset();
    listPipelines.mockResolvedValue([defaultPipeline]);
    getPipelineBoard.mockResolvedValue(defaultBoard);
    listTeamMembers.mockResolvedValue([]);
    joinTenantGroup.mockResolvedValue(undefined);
  });

  it("renders the default sales stages and cards", async () => {
    render(
      <ToastProvider>
        <PipelineWorkspace tenantId="tenant-1" />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Nuevo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sitio web" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ganada" })).toBeInTheDocument();
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
