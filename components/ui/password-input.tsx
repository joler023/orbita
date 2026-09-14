"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "leadingIcon">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex w-full flex-col">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        // Edge and Chrome add their own reveal control; ours replaces it.
        className={["pr-11 [&::-ms-reveal]:hidden", className].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute top-[30px] right-1 flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
