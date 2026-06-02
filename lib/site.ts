/**
 * Global brand configuration and copy.
 *
 * This is the single source of truth for brand-level strings: name,
 * tagline, the short brand statement used in the footer, contact details,
 * and social links. Edit here to update them everywhere.
 */

export const site = {
  name: "Soul Blueprint",
  founder: "Shayly McDonnell",
  url: "https://soulblueprint.studio",
  // Used in <title> templates and OG metadata.
  tagline: "Writing, Insight, and Private Guidance for Transformation",
  // One-line description for SEO / OG.
  description:
    "Soul Blueprint is a writing and advisory platform for people navigating transformation, identity shifts, and the deeper questions of meaning. Essays, frameworks, and private work from Shayly McDonnell.",
  // Short brand statement, used in the footer.
  statement:
    "A writing and advisory practice at the intersection of spiritual inquiry, psychological insight, and cultural analysis — for people rebuilding meaning in real time.",
  footerLine: "For seekers, thinkers, and those rebuilding meaning in real time.",
  email: "hello@soulblueprint.studio",
  // Social placeholders — replace href values when accounts exist.
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Substack", href: "#" },
    { label: "Bluesky", href: "#" },
  ],
} as const;

export type Social = (typeof site.socials)[number];
