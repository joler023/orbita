"use client";

import { Orbit } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-orbita-700">
      <span className="flex size-8 items-center justify-center rounded-full bg-orbita-50">
        <Orbit className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Órbita</span>
    </Link>
  );
}
