import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { NewsletterForm } from "./Newsletter";

/**
 * Full-width newsletter section used across pages. Calm, not desperate —
 * the newsletter is framed as signal, not "updates."
 */
export function NewsletterSection({
  tone = "parchment",
}: {
  tone?: "parchment" | "ink" | "bone";
}) {
  const onInk = tone === "ink";
  return (
    <Section tone={tone}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <Reveal>
          <p className={onInk ? "label text-gold" : "label"}>The Dispatch</p>
          <h2 className="mt-5 text-h2 text-balance">
            Language for what you&rsquo;re living, before it&rsquo;s tidy.
          </h2>
          <p className={`mt-5 max-w-md text-body ${onInk ? "text-bone/70" : "text-charcoal"}`}>
            Essays, frameworks, and dispatches from the work — sent when there&rsquo;s
            something worth saying, and not otherwise. For people who want depth and a
            little discernment, not another inbox to manage.
          </p>
        </Reveal>
        <Reveal delay={120} className="lg:pt-2">
          <NewsletterForm />
        </Reveal>
      </div>
    </Section>
  );
}
