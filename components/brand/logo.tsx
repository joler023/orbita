import Image from "next/image";
import Link from "next/link";

const LOGO_MIN_WIDTH = 140;

export type LogoVariant = "color" | "white";

const logoAsset: Record<LogoVariant, { src: string; aspectRatio: number }> = {
  color: { src: "/brand/orbita-wordmark.svg", aspectRatio: 665 / 155 },
  white: { src: "/brand/orbita-logo-white.png", aspectRatio: 1552 / 384 },
};

export type LogoProps = {
  href?: string;
  variant?: LogoVariant;
  width?: number;
};

export function Logo({ href = "/", variant = "color", width = LOGO_MIN_WIDTH }: LogoProps) {
  // The identity manual forbids the logotype below 140px wide on screen.
  const safeWidth = Math.max(width, LOGO_MIN_WIDTH);
  const asset = logoAsset[variant];

  return (
    <Link
      href={href}
      className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orbita-500"
    >
      <Image
        src={asset.src}
        alt="Órbita"
        width={safeWidth}
        height={Math.round(safeWidth / asset.aspectRatio)}
        priority
      />
    </Link>
  );
}
