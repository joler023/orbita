import { apiDownload } from "./client";

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadContactsExport(tenantId: string): Promise<void> {
  const { blob, fileName } = await apiDownload(`/api/tenants/${tenantId}/exports/contacts`);
  triggerBrowserDownload(blob, fileName ?? "orbita-contacts.csv");
}

export async function downloadOpportunitiesExport(tenantId: string): Promise<void> {
  const { blob, fileName } = await apiDownload(`/api/tenants/${tenantId}/exports/opportunities`);
  triggerBrowserDownload(blob, fileName ?? "orbita-opportunities.csv");
}
