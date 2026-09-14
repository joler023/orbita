import { Logo } from "@/components/brand/logo";
import { ScreenTransition } from "@/components/ui/screen-transition";
import { GuestOnly } from "@/lib/session/guest-only";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly>
      <div className="flex min-h-full items-center justify-center bg-orbita-50 px-4 py-10">
        <ScreenTransition className="w-full max-w-md rounded-xl bg-surface p-8 shadow-sm">
          <div className="mb-6">
            <Logo />
          </div>
          {children}
        </ScreenTransition>
      </div>
    </GuestOnly>
  );
}
