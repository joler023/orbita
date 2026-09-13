import { AgentsWorkspace } from "@/components/agents/agents-workspace";

export default async function AgentePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <AgentsWorkspace tenantId={tenantId} />;
}
