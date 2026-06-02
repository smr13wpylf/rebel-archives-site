import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/cn";

/**
 * Standard page header block — eyebrow label, large serif title, and an
 * optional lede. Used at the top of interior pages for consistent rhythm.
 */
export function PageIntro({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header className={cn("border-b border-line bg-bone pt-40 pb-16 sm:pb-20", className)}>
      <Container>
        <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
          {eyebrow && (
            <Reveal>
              <p className="label mb-5">{eyebrow}</p>
            </Reveal>
          )}
          <Reveal delay={80}>
            <h1 className="text-display text-ink text-balance">{title}</h1>
          </Reveal>
          {lede && (
            <Reveal delay={160}>
              <p
                className={cn(
                  "mt-6 max-w-2xl text-lede text-charcoal",
                  align === "center" && "mx-auto",
                )}
              >
                {lede}
              </p>
            </Reveal>
          )}
        </div>
      </Container>
    </header>
  );
}
