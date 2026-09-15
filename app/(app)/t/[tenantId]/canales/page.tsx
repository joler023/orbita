import { ChannelsWorkspace } from "@/components/channels/channels-workspace";

export default async function CanalesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <ChannelsWorkspace tenantId={tenantId} />;
}
