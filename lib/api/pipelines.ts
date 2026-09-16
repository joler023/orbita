import { apiRequest } from "./client";

export type StageSummary = {
  id: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
};

export type PipelineSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: StageSummary[];
};

export function listPipelines(tenantId: string): Promise<PipelineSummary[]> {
  return apiRequest<PipelineSummary[]>(`/api/tenants/${tenantId}/pipelines`);
}

export function createPipeline(tenantId: string, name: string): Promise<PipelineSummary> {
  return apiRequest<PipelineSummary>(`/api/tenants/${tenantId}/pipelines`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updatePipeline(
  tenantId: string,
  pipelineId: string,
  body: { name?: string; isDefault?: boolean },
): Promise<PipelineSummary> {
  return apiRequest<PipelineSummary>(`/api/tenants/${tenantId}/pipelines/${pipelineId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deletePipeline(tenantId: string, pipelineId: string): Promise<void> {
  return apiRequest<void>(`/api/tenants/${tenantId}/pipelines/${pipelineId}`, {
    method: "DELETE",
  });
}

export function createStage(
  tenantId: string,
  pipelineId: string,
  body: { name: string; isWon?: boolean; isLost?: boolean },
): Promise<PipelineSummary> {
  return apiRequest<PipelineSummary>(`/api/tenants/${tenantId}/pipelines/${pipelineId}/stages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateStage(
  tenantId: string,
  pipelineId: string,
  stageId: string,
  body: { name?: string; isWon?: boolean; isLost?: boolean },
): Promise<PipelineSummary> {
  return apiRequest<PipelineSummary>(
    `/api/tenants/${tenantId}/pipelines/${pipelineId}/stages/${stageId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function reorderStages(
  tenantId: string,
  pipelineId: string,
  stageIds: string[],
): Promise<PipelineSummary> {
  return apiRequest<PipelineSummary>(`/api/tenants/${tenantId}/pipelines/${pipelineId}/stages/order`, {
    method: "PUT",
    body: JSON.stringify({ stageIds }),
  });
}

export function deleteStage(
  tenantId: string,
  pipelineId: string,
  stageId: string,
  relocateToStageId?: string,
): Promise<PipelineSummary> {
  const query = relocateToStageId ? `?relocateToStageId=${relocateToStageId}` : "";
  return apiRequest<PipelineSummary>(
    `/api/tenants/${tenantId}/pipelines/${pipelineId}/stages/${stageId}${query}`,
    { method: "DELETE" },
  );
}
