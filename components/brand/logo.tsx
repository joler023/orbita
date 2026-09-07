import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex h-[26px] w-[111px] shrink-0 items-center">
      <img
        src="/brand/orbita-wordmark.svg"
        alt="Órbita"
        width={111}
        height={26}
        className="h-[26px] w-[111px] object-contain object-left"
      />
    </Link>
  );
}
