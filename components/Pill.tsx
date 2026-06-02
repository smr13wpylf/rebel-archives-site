import { cn } from "@/lib/cn";

/**
 * Category / tag / status pill. Quiet by default; `tone` shifts emphasis.
 */
export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "outline" | "muted";
  className?: string;
}) {
  const tones = {
    default: "bg-stone/60 text-charcoal",
    outline: "border border-line text-taupe",
    muted: "text-taupe",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-sans text-micro uppercase tracking-label",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
