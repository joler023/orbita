"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { clearLocalSession } from "@/lib/session/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type SignOutButtonProps = {
  children?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function SignOutButton({
  children = "Cerrar sesión",
  variant = "ghost",
  size = "sm",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const signOut = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      // Clearing local state still lets the person leave even if the API is down.
    }
    clearLocalSession();
    router.replace("/login");
  };

  return (
    <Button variant={variant} size={size} className={className} disabled={leaving} onClick={() => void signOut()}>
      {children}
    </Button>
  );
}
