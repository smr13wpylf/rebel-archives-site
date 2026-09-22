# Adding an ebook to Rebel Archives

This is the intake workflow for real, sellable Rebel Archives ebooks. It
assumes no coding knowledge beyond running one command in a terminal.

## The one command

```
node tools/add-book.mjs
```

It asks you questions one at a time — title, who wrote/compiled/archived
it, a public summary, format, price to display, and so on — lets you skip
anything optional, and at the end asks for two file paths on your
computer: the **cover image** and the **ebook file(s)** (PDF/EPUB/etc.).

- The cover gets copied into `assets/covers/<slug>/` — this is public,
  it ships with the site.
- The ebook file(s) get copied into `private/ebooks/<slug>/` — this
  folder is **never committed to git and never deployed**. It's just a
  tidy local staging area on your machine.
- A record is written to `data/volumes/<slug>.json` with everything a
  visitor is allowed to see before buying: title, summary, formats,
  price, attribution, and (once you have it) a link to buy.

## Why the file itself never goes in the repo

This site is a plain static GitHub Pages deployment — there's no server,
no login, no access control of any kind. Anything committed here is
downloadable by anyone who finds the URL, full stop, regardless of
whatever button or paywall the interface shows. So the real ebook file
can never live in this repo if it's meant to be sold.

Instead: **you sell it from a third-party store** — Gumroad, Payhip,
LemonSqueezy, or whatever you prefer. That platform hosts the file,
takes the payment, and delivers the download to the buyer. This site's
job is just to show the book, its summary, and a "Purchase" button that
links out to that store.

## The full flow for one book

1. **Run the command.** `node tools/add-book.mjs`, answer the questions.
   When it asks for formats, price, and state, it's fine to leave the
   state as `hidden-draft` (the default) — that means the book stays
   invisible to any future public view until you say otherwise.
2. **Upload to your store.** Take the file(s) from
   `private/ebooks/<slug>/` (the tool tells you exactly where) and
   create the product yourself on Gumroad/Payhip/whatever you use. Set
   whatever price you want there — the `price` field in the record is
   just a display label here and isn't connected to any real charge.
3. **Record the link.** Once the product page exists:

   ```
   node tools/add-book.mjs --set-purchase-link <slug> https://your-store.example/product "Buy the Ebook"
   ```

   This fills in `purchase.href` and `purchase.label` on the existing
   record — no need to redo the questionnaire.
4. **Go live.** When you're ready for it to be visible, open
   `data/volumes/<slug>.json` and change `"state"` to `"public"` (or
   whatever state fits — see below). The validator refuses to let a
   book be `public` with no purchase link, so this is a safety check,
   not just a formality.
5. **Check and commit.** `node tools/validate.mjs` — it re-checks
   everything and regenerates `data/catalog-index.json`. Commit both
   the record and the regenerated index.

## Preparing a draft by hand instead

If you'd rather write the record yourself before running anything: copy
`data/examples/volume-template.json`, fill it in (delete the
`_underscore` hint keys), and run:

```
node tools/add-book.mjs --from your-draft.json
```

The two tool-only keys `_coverPath` and `_ebookPaths` in that template
point at files on your computer; the command copies them into place the
same way the interactive questionnaire does.

## States

- `hidden-draft` — you're still staging it; invisible everywhere once a
  public view exists.
- `forthcoming` — publicly announced as coming, not sold yet.
- `public` — live and for sale (requires a purchase link).
- `portfolio-preview` — shown as a case study, not necessarily for sale.
- `private` — visible as a record, not for sale.
- `active-research` / `archived` — where a title is in its lifecycle.

## Removing a book

Delete `data/volumes/<slug>.json`, delete `assets/covers/<slug>/`, and
delete `private/ebooks/<slug>/` (which was never committed anyway). Run
`node tools/validate.mjs` to confirm the catalog is still clean.

## What's not built yet

There's no public-facing page or shelf display for this catalog yet —
right now this is just the data layer and the intake tool. The "pull it
off the shelf" browsing and inspection experience is the next thing to
design together, informed by real book records instead of a demo.
