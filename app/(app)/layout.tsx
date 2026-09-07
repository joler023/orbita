import { AuthGate } from "@/lib/session/auth-gate";
import type { ReactNode } from "react";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
