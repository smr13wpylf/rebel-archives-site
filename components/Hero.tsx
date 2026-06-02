import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { Button } from "./Button";

/**
 * Home hero. Editorial, spacious, type-led — no stock imagery. A faint
 * gold hairline motif anchors the composition without decoration.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-44 pb-section sm:pt-48">
      {/* faint structural hairlines — quiet "blueprint" texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line/60" />
        <div className="absolute left-0 top-[42%] h-px w-full bg-line/40" />
      </div>

      <Container className="relative">
        <div className="max-w-4xl">
          <Reveal>
            <p className="label">Soul Blueprint &mdash; a studio for inquiry</p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-7 text-display-lg text-ink text-balance">
              Language for the parts of your life that don&rsquo;t fit a slogan.
            </h1>
          </Reveal>
          <Reveal delay={170}>
            <p className="mt-8 max-w-2xl text-lede text-charcoal">
              A writing and advisory practice for people navigating transformation,
              identity shifts, grief, and reinvention &mdash; where spiritual inquiry meets
              psychological insight and cultural analysis, without the perfume.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href="/writing">Read the Journal</Button>
              <Button href="/work-with-me" variant="secondary">
                Work With Me
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
