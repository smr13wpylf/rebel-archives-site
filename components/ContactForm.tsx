"use client";

import { useState } from "react";
import { Button } from "./Button";
import { TextField, TextArea, SelectField } from "./FormInput";

/**
 * Contact / inquiry form.
 *
 * Front-end placeholder: `handleSubmit` fakes a success state. To make it
 * live, post the FormData to a Next.js route handler (e.g. /api/contact),
 * a server action, or a service like Formspree / Resend. Field `name`
 * attributes match their ids, so wiring is straightforward.
 */
export function ContactForm({
  inquiryOptions,
}: {
  inquiryOptions?: string[];
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    // TODO: send to your endpoint / service here.
    await new Promise((r) => setTimeout(r, 700));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="border border-line bg-parchment p-8" role="status">
        <h3 className="font-serif text-h3 text-ink">Received, with thanks.</h3>
        <p className="mt-3 text-body text-charcoal">
          I read every note myself. You&rsquo;ll usually hear back within a few business
          days &mdash; sooner if it&rsquo;s brief, a little longer if it deserves a real
          answer.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <div className="grid gap-7 sm:grid-cols-2">
        <TextField id="name" label="Name" required autoComplete="name" />
        <TextField id="email" label="Email" type="email" required autoComplete="email" />
      </div>
      {inquiryOptions && (
        <SelectField id="subject" label="This is about" options={inquiryOptions} />
      )}
      <TextArea
        id="message"
        label="Your note"
        required
        rows={6}
        placeholder="Say as much or as little as you like. Context helps."
      />
      <div className="flex items-center gap-5">
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending" : "Send note"}
        </Button>
        <p className="text-meta text-taupe">No autoresponders. A real reply.</p>
      </div>
    </form>
  );
}
