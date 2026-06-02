# Soul Blueprint

A writing, publishing, and advisory platform for people navigating
transformation, identity shifts, grief, and reinvention — at the intersection
of spiritual inquiry, psychological insight, and cultural analysis. Founded by
Shayly McDonnell.

This repository is the brand's home base: an editorial, longform-friendly site
built to hold essays, private work, and future digital products without
fragmenting.

---

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS 3.4** (design tokens wired to CSS variables)
- **Markdown** content layer for the journal (`gray-matter` + `react-markdown` + `remark-gfm`)
- **next/font** for self-hosted Google fonts (Fraunces + Inter)

No CMS is required to run; content lives in the repo as typed data and Markdown,
and the structure is intentionally CMS-ready (see below).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (statically prerenders every page)
npm run start    # serve the production build
```

---

## Project structure

```
app/                       Routes (App Router)
  layout.tsx               Root layout: fonts, global metadata, header/footer, skip link
  template.tsx             Subtle page-transition wrapper (re-mounts per navigation)
  globals.css              Design tokens + base styles + .prose-editorial reading styles
  page.tsx                 Home
  about/                   About
  work-with-me/            Private work + inquiry form
  writing/                 Journal archive
  writing/[slug]/          Individual post template (SSG via generateStaticParams)
  offerings/               Offerings, grouped by kind
  subscribe/               Newsletter landing page
  contact/                 Contact + inquiry form
  now/                     "Now" page (current focus)
  not-found.tsx            404
  sitemap.ts, robots.ts    SEO

components/                Reusable UI (see "Component library" below)

content/
  journal/*.md             Journal posts — one Markdown file per post

lib/
  site.ts                  Brand-level copy & config (name, tagline, socials, email)
  navigation.ts            Header + footer nav
  posts.ts                 Journal content layer (reads content/journal, server-only)
  format.ts                Pure formatters safe for client components
  offerings.ts             Private-work containers + offerings data
  faqs.ts                  FAQ content
  cn.ts                    Tiny classnames helper
```

---

## Where the brand copy lives

| What | Where |
| --- | --- |
| Brand name, tagline, statement, footer line, email, socials | `lib/site.ts` |
| Header & footer navigation | `lib/navigation.ts` |
| Home / About / Subscribe / etc. section copy | the respective file in `app/` |
| Journal posts | `content/journal/*.md` |
| Offerings & private-work containers | `lib/offerings.ts` |
| FAQs | `lib/faqs.ts` |

Most page copy is written inline in each page component so it reads in context.
Anything shared across pages (brand statement, nav, data collections) is
centralized in `lib/`.

## Adding a journal post

1. Create a new Markdown file in `content/journal/`. The **filename is the URL
   slug** — `reinvention-is-not-escape.md` → `/writing/reinvention-is-not-escape`.
2. Add frontmatter:

   ```md
   ---
   title: The Title of the Essay
   excerpt: A one- or two-sentence standfirst used in cards and metadata.
   category: Essays        # Essays | Cultural Analysis | Soul Blueprint | Shadow Work | Notes / Dispatches | ...
   date: 2026-05-18        # YYYY-MM-DD
   featured: true          # optional — surfaces on the home page
   ---

   Body in Markdown. Headings, **bold**, _italic_, lists, > blockquotes,
   links, images, and `---` dividers are all styled.
   ```

3. That's it — the post is picked up automatically. No code changes; the route,
   archive listing, category filter, prev/next, related posts, and sitemap all
   update on the next build. Reading time is estimated automatically unless you
   set `readingTime` in frontmatter.

Categories are derived from the posts themselves, so a new `category:` value
appears as a filter on `/writing` with no extra wiring.

## Replacing placeholder offerings

Edit `lib/offerings.ts`:

- **`privateWork`** drives the containers listed on `/work-with-me`
  (title, format, cadence, summary, bullet details).
- **`offerings`** drives the cards on `/offerings` and the home preview. Each
  has a `kind` (`Guide | Session | Workshop | Framework`), a `status`
  (`Available | In progress | Forthcoming`), a soft `price` string, and an
  `href`. The Offerings page groups cards by `kind` automatically — add a new
  kind by extending the `groups` array in `app/offerings/page.tsx`.

## Connecting the forms later

All forms are front-end placeholders today; each `handleSubmit` fakes a success
state and is marked with a `// TODO`.

- **Newsletter** (`components/Newsletter.tsx`): the field is named `email`.
  Replace the body of `handleSubmit` with a POST to ConvertKit / Substack /
  Beehiiv / Buttondown, or to a Next.js route handler that proxies them.
- **Contact / inquiry** (`components/ContactForm.tsx`): field names match their
  ids (`name`, `email`, `subject`, `message`). Post the `FormData` to a route
  handler (`app/api/contact/route.ts`), a server action, or a service like
  Formspree / Resend.

The markup is provider-agnostic, so wiring is a matter of swapping the submit
handler — no structural changes needed.

---

## Component library

| Component | Purpose |
| --- | --- |
| `Header` / `Footer` | Sticky minimal nav (with mobile panel) and editorial footer |
| `Hero` | Home hero |
| `Section` / `Container` | Layout primitives: background tone + vertical rhythm + max-width |
| `PageIntro` | Standard interior-page header (eyebrow / title / lede) |
| `EditorialCard` | Journal card — `default`, `feature`, and `compact` variants |
| `OfferingCard` | Offering/product card |
| `Quote` | Standalone pull-quote |
| `Newsletter` / `NewsletterSection` | Signup form + full-width section |
| `CTABlock` | Closing call-to-action band |
| `Markdown` | Rich-text renderer for posts (styled via `.prose-editorial`) |
| `Pill` | Category / tag / status pill |
| `FormInput` | Accessible `TextField` / `TextArea` / `SelectField` |
| `ContactForm` / `FAQ` | Inquiry form + accessible FAQ accordion |
| `Reveal` | Subtle fade-and-rise on scroll (honors reduced motion) |
| `Logo` | Wordmark + restrained drawn glyph |

## Design system

Defined in `tailwind.config.ts` and `app/globals.css`.

- **Color tokens** (CSS variables): `bone`, `parchment`, `stone`, `sand`, `ink`,
  `charcoal`, `taupe`, `fig` (deep accent), `gold` (hairline accent), `line`.
  Because they're variables, a future theme or dark mode can be introduced
  without touching components.
- **Type scale**: a literary serif (Fraunces) for headings + longform, a quiet
  sans (Inter) for UI/labels. Fluid `clamp()` sizes from `display-lg` down to
  `micro`.
- **Spacing**: a fluid `section` / `section-sm` rhythm plus a `label` letter-spacing.
- **Buttons**: `primary`, `secondary`, `ghost` variants in `components/Button.tsx`.
- **Reading surface**: `.prose-editorial` in `globals.css` controls the longform
  experience — measure, line height, blockquotes, lists, dividers, captions.

## Accessibility & SEO

- Semantic landmarks, a skip-to-content link, visible focus states, labelled
  form controls, `aria-expanded`/`aria-current` on interactive nav and accordions.
- Motion is subtle and gated behind `prefers-reduced-motion`.
- Per-page metadata (title template, description, Open Graph, Twitter),
  `Article` JSON-LD on posts, generated `sitemap.xml` and `robots.txt`.

---

_For seekers, thinkers, and those rebuilding meaning in real time._
