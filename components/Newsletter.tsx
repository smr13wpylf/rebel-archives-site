"use client";

import { useState } from "react";
import { Button } from "./Button";

/**
 * Newsletter signup.
 *
 * This is a front-end placeholder. The submit handler currently fakes a
 * success state. To connect a real provider (ConvertKit / Substack /
 * Beehiiv / Buttondown), replace the body of `handleSubmit` with a fetch
 * to your provider's form endpoint or a Next.js route handler / server
 * action. The markup and field name (`email`) are provider-agnostic.
 */
export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    // TODO: replace with real provider integration.
    await new Promise((r) => setTimeout(r, 600));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="font-serif text-lede text-ink" role="status">
        You&rsquo;re in. Look for the next dispatch &mdash; no noise in between.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="label text-charcoal">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full border-b border-line bg-transparent py-3 font-sans text-body text-ink placeholder:text-taupe/70 transition-colors duration-300 focus:border-fig focus:outline-none"
          />
        </div>
        <Button type="submit" disabled={status === "submitting"} size={compact ? "sm" : "default"}>
          {status === "submitting" ? "One moment" : "Subscribe"}
        </Button>
      </div>
      <p className="mt-4 text-meta text-taupe">
        Thoughtful writing, sent occasionally. No funnels, no urgency. Leave whenever it stops being useful.
      </p>
    </form>
  );
}
