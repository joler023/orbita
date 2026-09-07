"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/api/auth";
import { readLastTenantId } from "@/lib/session/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then(() => {
        if (cancelled) {
          return;
        }
        const tenantId = readLastTenantId();
        router.replace(tenantId ? `/t/${tenantId}/inicio` : "/sin-organizacion");
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Skeleton className="h-72 w-full max-w-md" />
      </div>
    );
  }

  return children;
}
