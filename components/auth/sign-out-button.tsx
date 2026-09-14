"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/cn";
import { clearLocalSession } from "@/lib/session/storage";
import { LogOut } from "lucide-react";
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
    <Button
      variant={variant}
      size={size}
      className={cn(
        "group gap-2 transition-all hover:bg-danger-bg hover:text-danger-fg active:scale-[0.98]",
        className,
      )}
      disabled={leaving}
      onClick={() => void signOut()}
      leadingIcon={
        <LogOut
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      }
    >
      {leaving ? "Saliendo…" : children}
    </Button>
  );
}
