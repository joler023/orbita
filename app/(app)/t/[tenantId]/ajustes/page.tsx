import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export default async function AjustesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <SettingsWorkspace tenantId={tenantId} />;
}
