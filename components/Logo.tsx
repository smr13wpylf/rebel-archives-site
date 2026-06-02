import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Wordmark. A small drawn glyph (an abstract "blueprint" node — a circle
 * tethered to a line) sits beside the name. Intentionally restrained:
 * no moons, no stars, no mandalas.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Soul Blueprint — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="text-gold transition-colors duration-300 group-hover:text-fig"
      >
        <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1" />
        <circle cx="10" cy="10" r="2.4" fill="currentColor" />
        <path d="M10 10L17 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-[1.15rem] leading-none tracking-tight text-ink">
        Soul Blueprint
      </span>
    </Link>
  );
}
