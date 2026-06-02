import { cn } from "@/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** narrower max-width variants for reading-focused layouts */
  width?: "default" | "prose" | "narrow";
  as?: React.ElementType;
};

const widths = {
  default: "max-w-container",
  prose: "max-w-prose",
  narrow: "max-w-narrow",
};

export function Container({
  children,
  className,
  width = "default",
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-6 sm:px-8 lg:px-12", widths[width], className)}>
      {children}
    </Tag>
  );
}
