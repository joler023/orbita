import { ContactDetailView } from "@/components/crm/contact-detail";
import { isUuid } from "@/lib/navigation";
import { notFound } from "next/navigation";

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ tenantId: string; contactId: string }>;
}) {
  const { tenantId, contactId } = await params;
  if (!isUuid(contactId)) {
    notFound();
  }

  return <ContactDetailView tenantId={tenantId} contactId={contactId} />;
}
