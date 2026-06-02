import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Soul Blueprint — for inquiries about private work, writing, collaborations, or press. A real person reads every note.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Say what you're sitting with."
        lede="For private work, writing, collaborations, or a question that doesn't fit a box. A real person reads every note — and replies."
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          {/* Form */}
          <Reveal>
            <ContactForm
              inquiryOptions={[
                "Private work / readings",
                "Writing & essays",
                "Collaboration",
                "Press or speaking",
                "Something else",
              ]}
            />
          </Reveal>

          {/* Aside */}
          <Reveal delay={120}>
            <div className="space-y-10 lg:border-l lg:border-line lg:pl-12">
              <div>
                <p className="label mb-3 text-charcoal">Response times</p>
                <p className="text-body text-charcoal">
                  I answer notes myself, usually within a few business days. Thoughtful
                  questions sometimes take a little longer &mdash; they deserve a real
                  reply, not a reflex.
                </p>
              </div>
              <div>
                <p className="label mb-3 text-charcoal">Direct</p>
                <a
                  href={`mailto:${site.email}`}
                  className="link-underline text-body text-fig"
                >
                  {site.email}
                </a>
              </div>
              <div>
                <p className="label mb-3 text-charcoal">Elsewhere</p>
                <ul className="space-y-2">
                  {site.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        className="link-underline text-body text-charcoal hover:text-ink"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label mb-3 text-charcoal">Prefer the slow channel?</p>
                <p className="text-body text-charcoal">
                  The dispatch is the best way to stay close to the work without an inbox
                  exchange.{" "}
                  <a href="/subscribe" className="link-underline text-fig">
                    Subscribe here
                  </a>
                  .
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
