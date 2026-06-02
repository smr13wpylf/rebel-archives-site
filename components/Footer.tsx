import Link from "next/link";
import { site } from "@/lib/site";
import { footerNav } from "@/lib/navigation";
import { Container } from "./Container";
import { NewsletterForm } from "./Newsletter";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-parchment">
      <Container className="py-section-sm">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          {/* Brand + newsletter */}
          <div className="max-w-md">
            <p className="font-serif text-2xl leading-tight tracking-tight text-ink">
              Soul Blueprint
            </p>
            <p className="mt-4 text-body text-charcoal">{site.statement}</p>
            <div className="mt-8">
              <p className="label mb-3 text-charcoal">Subscribe to the dispatch</p>
              <NewsletterForm compact />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerNav.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <p className="label mb-4 text-taupe">{group.heading}</p>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="link-underline text-body text-charcoal hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Base row */}
        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-serif text-base italic text-taupe">
            {site.footerLine}
          </p>
          <div className="flex items-center gap-6">
            {site.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="link-underline text-meta uppercase tracking-label text-taupe hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-8 text-meta text-taupe">
          &copy; {year} Soul Blueprint · {site.founder}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
