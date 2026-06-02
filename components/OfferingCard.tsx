import Link from "next/link";
import type { Offering } from "@/lib/offerings";
import { Pill } from "./Pill";

/**
 * Offering card for the Offerings page and home preview.
 * Status communicates availability without urgency.
 */
export function OfferingCard({ offering }: { offering: Offering }) {
  return (
    <Link
      href={offering.href}
      className="group flex h-full flex-col justify-between gap-8 border border-line bg-bone p-7 transition-colors duration-300 hover:border-gold sm:p-8"
    >
      <div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <Pill tone="outline">{offering.kind}</Pill>
          <span className="text-micro uppercase tracking-label text-taupe">
            {offering.status}
          </span>
        </div>
        <h3 className="text-h3 text-ink transition-colors duration-300 group-hover:text-fig">
          {offering.title}
        </h3>
        <p className="mt-4 text-body text-charcoal">{offering.description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-5">
        <span className="font-serif text-lg text-ink">{offering.price}</span>
        <span className="text-meta uppercase tracking-label text-taupe transition-colors group-hover:text-fig">
          {offering.status === "Available" ? "Begin →" : "Notify me →"}
        </span>
      </div>
    </Link>
  );
}
