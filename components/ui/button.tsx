import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-orbita-500 text-white hover:bg-orbita-600 disabled:bg-orbita-200 disabled:text-white",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-orbita-50 disabled:text-muted",
  ghost: "text-foreground hover:bg-orbita-50 disabled:text-muted",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  leadingIcon,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
