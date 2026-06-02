import { cn } from "@/lib/cn";
import { Container } from "./Container";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  /** background tone */
  tone?: "bone" | "parchment" | "ink";
  /** vertical rhythm */
  spacing?: "default" | "sm";
  width?: "default" | "prose" | "narrow";
  id?: string;
  as?: React.ElementType;
};

const tones = {
  bone: "bg-bone text-ink",
  parchment: "bg-parchment text-ink",
  ink: "bg-ink text-bone",
};

/**
 * Section wrapper — pairs a background tone with consistent vertical
 * rhythm and a centered container. The building block for every page.
 */
export function Section({
  children,
  className,
  tone = "bone",
  spacing = "default",
  width = "default",
  id,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        tones[tone],
        spacing === "default" ? "py-section" : "py-section-sm",
        className,
      )}
    >
      <Container width={width}>{children}</Container>
    </Tag>
  );
}
