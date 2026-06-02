import { Container } from "./Container";
import { Reveal } from "./Reveal";

/**
 * Standalone pull-quote block for use between sections.
 * Large, calm serif with an optional attribution.
 */
export function Quote({
  children,
  cite,
}: {
  children: React.ReactNode;
  cite?: string;
}) {
  return (
    <Container width="prose" as="figure">
      <Reveal>
        <blockquote className="text-center font-serif text-[clamp(1.5rem,3.2vw,2.4rem)] italic leading-[1.32] tracking-tight text-ink text-balance">
          {children}
        </blockquote>
        {cite && (
          <figcaption className="mt-7 text-center text-meta uppercase tracking-label text-taupe">
            {cite}
          </figcaption>
        )}
      </Reveal>
    </Container>
  );
}
