import { PipelineWorkspace } from "@/components/crm/pipeline-workspace";

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <PipelineWorkspace tenantId={tenantId} />;
}
