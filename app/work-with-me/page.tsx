import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { FAQList } from "@/components/FAQ";
import { ContactForm } from "@/components/ContactForm";
import { privateWork } from "@/lib/offerings";
import { workFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Work With Me",
  description:
    "Private readings and advisory work with Shayly McDonnell — close, interpretive attention for people standing at a real threshold. Grounded, intelligent, never inflated.",
};

const expectations = [
  {
    title: "We start from your actual life",
    body: "Not a framework, not a generic chart reading. The systems serve the conversation; the conversation never serves the systems.",
  },
  {
    title: "Plain language, always",
    body: "You won't need to learn a vocabulary to get value. I translate. You leave understanding more than you arrived with.",
  },
  {
    title: "Honesty over reassurance",
    body: "I won't tell you what you want to hear if it isn't true. The respect is in the accuracy.",
  },
];

export default function WorkWithMePage() {
  return (
    <>
      <PageIntro
        eyebrow="Work With Me"
        title="Private work, for a threshold you're actually standing at."
        lede="Close interpretive attention for people in transition — a discerning second mind for the questions that don't have tidy answers."
      />

      {/* Who it's for */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="label">Who this is for</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-h3 font-serif leading-snug text-ink text-balance">
              For people in rupture, reinvention, grief, or creative emergence who want to
              understand what&rsquo;s happening &mdash; not just be told it&rsquo;ll be okay.
            </p>
            <p className="mt-6 max-w-2xl text-body text-charcoal">
              This is for the moment you can feel a change coming but can&rsquo;t yet see
              it clearly; for the decision that won&rsquo;t resolve; for the pattern that
              keeps returning in new clothes. You don&rsquo;t need to know anything about
              astrology or human design. You only need a real question and the willingness
              to look at it honestly.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Containers */}
      <Section tone="parchment">
        <Reveal>
          <p className="label mb-4">The containers</p>
          <h2 className="max-w-2xl text-h2 text-ink text-balance">
            Four ways to work together, depending on the question and the season.
          </h2>
        </Reveal>
        <div className="mt-14 space-y-px overflow-hidden border-y border-line">
          {privateWork.map((w, i) => (
            <Reveal key={w.slug} delay={i * 70}>
              <article className="grid gap-6 border-b border-line py-10 last:border-b-0 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
                <div>
                  <h3 className="text-h3 text-ink">{w.title}</h3>
                  <div className="mt-4 space-y-1">
                    <p className="text-meta uppercase tracking-label text-taupe">
                      {w.format}
                    </p>
                    <p className="text-meta uppercase tracking-label text-gold">
                      {w.cadence}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-body text-charcoal">{w.summary}</p>
                  <ul className="mt-5 space-y-2">
                    {w.details.map((d) => (
                      <li key={d} className="flex gap-3 text-body text-charcoal">
                        <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-gold" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* What to expect */}
      <Section>
        <Reveal>
          <p className="label mb-4">What to expect</p>
          <h2 className="max-w-2xl text-h2 text-ink text-balance">
            How this differs from coaching, and from being told to manifest.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {expectations.map((e, i) => (
            <Reveal key={e.title} delay={i * 90}>
              <span className="font-serif text-4xl text-gold/50">0{i + 1}</span>
              <h3 className="mt-5 text-h3 text-ink">{e.title}</h3>
              <p className="mt-3 text-body text-charcoal">{e.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* A note on fit */}
      <Section tone="parchment" width="prose" spacing="sm">
        <Reveal>
          <p className="label mb-4 text-center">A note on fit</p>
          <p className="text-center font-serif text-[clamp(1.3rem,2.4vw,1.85rem)] leading-snug text-ink text-balance">
            Discernment runs both ways. If I think someone else would serve you better,
            I&rsquo;ll say so. The right room matters more than a booked session.
          </p>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <Reveal>
            <h2 className="text-h2 text-ink">Questions, answered plainly.</h2>
          </Reveal>
          <Reveal delay={100}>
            <FAQList items={workFaqs} />
          </Reveal>
        </div>
      </Section>

      {/* Inquiry form */}
      <Section tone="ink" width="prose" id="inquire">
        <Reveal>
          <p className="label text-gold">Begin with an inquiry</p>
          <h2 className="mt-5 text-display text-bone text-balance">
            Tell me what you&rsquo;re sitting with.
          </h2>
          <p className="mt-5 text-lede text-bone/70">
            Every engagement starts here &mdash; a short note, no pressure. I&rsquo;ll
            reply with whether it&rsquo;s a fit and what working together would look like.
          </p>
        </Reveal>
        <Reveal delay={140} className="mt-12 [&_*]:border-bone/20 [&_label]:text-bone/60 [&_input]:text-bone [&_textarea]:text-bone [&_select]:text-bone">
          <ContactForm
            inquiryOptions={[
              "Soul Blueprint Reading",
              "Deep-Dive Session",
              "Private Advisory",
              "Custom Interpretive Work",
              "Not sure yet",
            ]}
          />
        </Reveal>
      </Section>
    </>
  );
}
