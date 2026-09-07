import { ContactsWorkspace } from "@/components/crm/contacts-workspace";

export default async function ContactosPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <ContactsWorkspace tenantId={tenantId} />;
}
