import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-meta uppercase tracking-label transition-all duration-300 ease-editorial disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-bone hover:bg-fig border border-ink hover:border-fig",
  secondary:
    "bg-transparent text-ink border border-ink/30 hover:border-ink hover:bg-ink hover:text-bone",
  ghost:
    "bg-transparent text-ink border-b border-transparent hover:border-gold px-0 tracking-normal normal-case text-body",
};

const sizes: Record<Size, string> = {
  default: "px-7 py-3.5",
  sm: "px-5 py-2.5",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href">;

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

type ButtonProps = ButtonAsLink | ButtonAsButton;

/**
 * Unified button + link. Renders a Next <Link> when `href` is provided,
 * otherwise a native <button>. Ghost variant reads as a quiet text link.
 */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "default", className, children } = props;
  const classes = cn(
    base,
    variant !== "ghost" && sizes[size],
    variants[variant],
    className,
  );

  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
