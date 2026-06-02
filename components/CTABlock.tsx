import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { Button } from "./Button";

/**
 * Closing call-to-action band, typically rendered on the ink tone for
 * contrast at the foot of a page. Two CTAs maximum, by design.
 */
export function CTABlock({
  eyebrow,
  title,
  body,
  primary,
  secondary,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <Section tone="ink" width="prose">
      <div className="text-center">
        {eyebrow && (
          <Reveal>
            <p className="label text-gold">{eyebrow}</p>
          </Reveal>
        )}
        <Reveal delay={80}>
          <h2 className="mt-5 text-display text-bone text-balance">{title}</h2>
        </Reveal>
        {body && (
          <Reveal delay={140}>
            <p className="mx-auto mt-6 max-w-xl text-lede text-bone/70">{body}</p>
          </Reveal>
        )}
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              href={primary.href}
              className="border-bone bg-bone text-ink hover:border-gold hover:bg-gold hover:text-ink"
            >
              {primary.label}
            </Button>
            {secondary && (
              <Button
                href={secondary.href}
                variant="secondary"
                className="border-bone/30 text-bone hover:border-bone hover:bg-bone hover:text-ink"
              >
                {secondary.label}
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
