/**
 * Offerings and private-work data.
 *
 * Two related collections:
 *  - `privateWork`: the one-on-one containers shown on /work-with-me
 *  - `offerings`: products, sessions, and future work shown on /offerings
 *
 * To add or change an offering, edit the arrays below. `cadence` and
 * `price` are intentionally soft strings (e.g. "By inquiry") so nothing
 * reads like a checkout funnel.
 */

export type PrivateWork = {
  slug: string;
  title: string;
  summary: string;
  format: string;
  cadence: string;
  details: string[];
};

export const privateWork: PrivateWork[] = [
  {
    slug: "soul-blueprint-reading",
    title: "Soul Blueprint Reading",
    summary:
      "A close interpretive read of the architecture you arrived with — astrology, human design, and the patterns underneath both — translated into plain, usable language.",
    format: "90 minutes, recorded · written summary after",
    cadence: "One session",
    details: [
      "A synthesis of your chart and design, read as a system rather than a horoscope",
      "Where your instincts are reliable and where they tend to mislead you",
      "Language for tensions you've felt but couldn't quite name",
    ],
  },
  {
    slug: "deep-dive-session",
    title: "Deep-Dive Session",
    summary:
      "A single, focused working session for a specific threshold — a decision, a rupture, a reinvention you can feel coming but can't yet see clearly.",
    format: "75 minutes, recorded",
    cadence: "One session, or as needed",
    details: [
      "We start from the actual situation, not a framework",
      "Symbolic and psychological lenses used in service of clarity, not performance",
      "You leave with a sharper question, not a borrowed answer",
    ],
  },
  {
    slug: "private-advisory",
    title: "Private Advisory",
    summary:
      "Ongoing, quiet counsel across a season of change — for people in the middle of building something or becoming someone, who want a steady, discerning second mind.",
    format: "Monthly sessions · correspondence between",
    cadence: "Three or six months",
    details: [
      "Continuity, so we're not re-explaining context every time",
      "Room for creative, spiritual, and strategic questions in the same conversation",
      "Held to a small number of clients at any given time",
    ],
  },
  {
    slug: "custom-interpretive",
    title: "Custom Interpretive Work",
    summary:
      "Bespoke written work — a long-form reading, a relational analysis, a map of a transition — produced as a document you can return to.",
    format: "Written deliverable · optional call",
    cadence: "By scope",
    details: [
      "For questions that deserve more than a single conversation",
      "Useful for relationships, transitions, and recurring patterns",
      "Delivered as a considered piece of writing, not a template",
    ],
  },
];

export type Offering = {
  slug: string;
  title: string;
  kind: "Guide" | "Session" | "Workshop" | "Framework";
  status: "Available" | "In progress" | "Forthcoming";
  description: string;
  price: string;
  href: string;
};

export const offerings: Offering[] = [
  {
    slug: "blueprint-reading",
    title: "Soul Blueprint Reading",
    kind: "Session",
    status: "Available",
    description:
      "A private, recorded interpretive session translating your chart and design into language you can actually use.",
    price: "By inquiry",
    href: "/work-with-me",
  },
  {
    slug: "field-notes-on-change",
    title: "Field Notes on Change",
    kind: "Guide",
    status: "Available",
    description:
      "A short, unsentimental guide to the stages of identity transition — what tends to break first, and what's usually fine to let go.",
    price: "$24",
    href: "/contact",
  },
  {
    slug: "discernment-framework",
    title: "The Discernment Framework",
    kind: "Framework",
    status: "In progress",
    description:
      "A downloadable working tool for telling intuition apart from anxiety, projection, and pattern — with prompts, not platitudes.",
    price: "Forthcoming",
    href: "/subscribe",
  },
  {
    slug: "shadow-work-intensive",
    title: "Shadow Work, Without the Theatre",
    kind: "Workshop",
    status: "Forthcoming",
    description:
      "A small-group intensive on the parts of the self we built to survive — grounded, structured, and free of spiritual performance.",
    price: "Forthcoming",
    href: "/subscribe",
  },
  {
    slug: "reinvention-report",
    title: "The Reinvention Report",
    kind: "Framework",
    status: "Forthcoming",
    description:
      "A custom written map of a transition you're in the middle of — produced as a document you can return to over a season.",
    price: "Forthcoming",
    href: "/work-with-me",
  },
  {
    slug: "annual-reading",
    title: "Year-Ahead Reading",
    kind: "Session",
    status: "Forthcoming",
    description:
      "An interpretive look at the shape of the year in front of you — the openings, the friction, and where to spend your attention.",
    price: "Forthcoming",
    href: "/subscribe",
  },
];
