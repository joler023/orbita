import { apiRequest } from "./client";

export type OpportunitySummary = {
  id: string;
  pipelineId: string;
  stageId: string;
  title: string;
  amount: number | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  lastMoveEventId: string | null;
  createdAt: string;
};

export type BoardStageSummary = {
  id: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
  amountSum: number;
  opportunities: OpportunitySummary[];
};

export type PipelineBoard = {
  pipelineId: string;
  pipelineName: string;
  stages: BoardStageSummary[];
};

export type OpportunityBoardQuery = {
  assignedToUserId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type OpportunityChangedEvent = {
  kind: "Created" | "Updated" | "Moved";
  eventId: string;
  opportunity: OpportunitySummary;
};

export function getPipelineBoard(
  tenantId: string,
  pipelineId: string,
  query: OpportunityBoardQuery = {},
): Promise<PipelineBoard> {
  const params = new URLSearchParams();
  if (query.assignedToUserId) {
    params.set("assignedToUserId", query.assignedToUserId);
  }
  if (query.createdFrom) {
    params.set("createdFrom", query.createdFrom);
  }
  if (query.createdTo) {
    params.set("createdTo", query.createdTo);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<PipelineBoard>(
    `/api/tenants/${tenantId}/pipelines/${pipelineId}/board${suffix}`,
  );
}

export function createOpportunity(
  tenantId: string,
  pipelineId: string,
  body: { title: string; amount?: number | null; stageId?: string; assignedToUserId?: string },
): Promise<OpportunitySummary> {
  return apiRequest<OpportunitySummary>(`/api/tenants/${tenantId}/pipelines/${pipelineId}/opportunities`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function moveOpportunity(
  tenantId: string,
  opportunityId: string,
  body: { stageId: string; eventId: string },
): Promise<OpportunitySummary> {
  return apiRequest<OpportunitySummary>(`/api/tenants/${tenantId}/opportunities/${opportunityId}/move`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function formatOpportunityAmount(amount: number | null): string {
  if (amount === null) {
    return "Sin monto";
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
