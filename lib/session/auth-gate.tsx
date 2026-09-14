"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser, type CurrentUser } from "@/lib/api/auth";
import { CurrentUserProvider } from "@/lib/session/current-user";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((current) => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!user) {
    return (
      <div className="flex min-h-full flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <CurrentUserProvider user={user}>{children}</CurrentUserProvider>;
}
