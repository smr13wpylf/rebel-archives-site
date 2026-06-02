"use client";

import { useState } from "react";
import type { FAQ } from "@/lib/faqs";
import { cn } from "@/lib/cn";

/**
 * Accessible FAQ accordion. Uses native <button> toggles with
 * aria-expanded / aria-controls and a region for each answer.
 */
export function FAQList({ items }: { items: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-h3 text-ink">{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 shrink-0 text-2xl font-light text-gold transition-transform duration-300 ease-editorial",
                    isOpen && "rotate-45",
                  )}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              hidden={!isOpen}
              className="pb-7"
            >
              <p className="max-w-2xl text-body text-charcoal">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
