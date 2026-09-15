import { InboxWorkspace } from "@/components/inbox/inbox-workspace";

export default async function BandejaPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <InboxWorkspace tenantId={tenantId} />;
}
