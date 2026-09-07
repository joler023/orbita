import { AppShell } from "@/components/shell/app-shell";
import { isUuid } from "@/lib/navigation";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  if (!isUuid(tenantId)) {
    notFound();
  }

  return <AppShell tenantId={tenantId}>{children}</AppShell>;
}
