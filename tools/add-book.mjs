#!/usr/bin/env node
/* Guided command for adding one ebook to the Rebel Archives catalog.

   node tools/add-book.mjs
       Interactive questionnaire.

   node tools/add-book.mjs --from draft.json
       Use a completed draft file instead of answering questions.

   node tools/add-book.mjs --set-purchase-link <slug> <https-url> [label]
       Once you've created the product on your store, record the link on
       an existing volume without re-running the whole questionnaire.

   Either path writes data/volumes/<slug>.json, copies cover art into
   assets/covers/<slug>/ (public), stages the actual ebook file(s) into
   private/ebooks/<slug>/ (gitignored — NEVER committed, NEVER deployed),
   regenerates data/catalog-index.json, and validates the whole catalog.

   The actual ebook file cannot be hosted by this site: GitHub Pages is
   plain static hosting with no access control, so anything committed
   here is effectively public regardless of any UI around it. Selling
   the book means creating it as a product on a third-party store
   (Gumroad, Payhip, LemonSqueezy, etc.) yourself and recording the
   resulting product URL with --set-purchase-link. See ADDING-A-BOOK.md. */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import {
  ROLES, STATES, FORMATS, SLUG_PATTERN, slugify, normalizeVolume
} from './lib/schema.mjs';
import { readJson, compileIndex } from './lib/catalog.mjs';
import { runValidation } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const existingSlugs = new Set(
  fs.existsSync(path.join(ROOT, 'data/volumes'))
    ? fs.readdirSync(path.join(ROOT, 'data/volumes')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    : []
);

const taxonomies = readJson(path.join(ROOT, 'data/taxonomies.json'));

/* --------------------------------------------------------- --set-purchase-link */

if (args.includes('--set-purchase-link')) {
  const i = args.indexOf('--set-purchase-link');
  const slug = args[i + 1];
  const url = args[i + 2];
  const label = args[i + 3] || 'Purchase';
  if (!slug || !url) {
    console.log('Usage: node tools/add-book.mjs --set-purchase-link <slug> <https-url> [button label]');
    process.exit(1);
  }
  const file = path.join(ROOT, 'data/volumes', `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.log(`No volume "${slug}" — expected ${path.relative(ROOT, file)}`);
    process.exit(1);
  }
  const record = normalizeVolume(readJson(file));
  record.purchase = { kind: 'external', href: url, label };
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
  console.log(`Updated purchase link for "${record.title}".`);
  finishUp(record.slug);
  process.exit(0);
}

/* -------------------------------------------------------------------- shared */

function copyIntoDir(destDir, srcPath, preferredBaseName) {
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(srcPath)) {
    console.log(`  ! Not found, skipped: ${srcPath}`);
    return null;
  }
  const ext = path.extname(srcPath).toLowerCase();
  const destName = `${preferredBaseName}${ext}`;
  const destPath = path.join(destDir, destName);
  fs.copyFileSync(srcPath, destPath);
  return destPath;
}

function finishUp(slug) {
  compileIndex(ROOT);
  const { errors, warnings } = runValidation(ROOT);
  for (const w of warnings) console.log('  warn ', w);
  for (const e of errors) console.log('  ERROR', e);
  if (errors.length) {
    console.log('\nValidation FAILED — fix the errors above, then re-run tools/validate.mjs.');
    process.exitCode = 1;
    return;
  }
  console.log('  ✓ Catalog validated. data/catalog-index.json is up to date.');
  const record = normalizeVolume(readJson(path.join(ROOT, 'data/volumes', `${slug}.json`)));
  console.log(`\n"${record.title}" — record: data/volumes/${slug}.json`);
  if (record.purchase.kind === 'none') {
    console.log('  No purchase link yet. When the product is live on your store, run:');
    console.log(`    node tools/add-book.mjs --set-purchase-link ${slug} https://your-store.example/product <button label>`);
  } else {
    console.log(`  Purchase link: ${record.purchase.href}`);
  }
  const stagingDir = path.join(ROOT, 'private/ebooks', slug);
  if (fs.existsSync(stagingDir) && fs.readdirSync(stagingDir).length) {
    console.log(`  Staged file(s) for you to upload to your store: ${path.relative(ROOT, stagingDir)}/`);
    for (const f of fs.readdirSync(stagingDir)) console.log(`    - ${f}`);
  }
}

/* ---------------------------------------------------------------- --from */

const fromFile = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;

if (fromFile) {
  const draft = readJson(path.resolve(fromFile));
  const record = normalizeVolume(draft);
  if (!record.slug) record.slug = slugify(record.title || '');
  if (existingSlugs.has(record.slug)) {
    console.log(`A volume with slug "${record.slug}" already exists. Edit data/volumes/${record.slug}.json directly, or change the draft's slug.`);
    process.exit(1);
  }
  const coverSrc = draft._coverPath || null;
  const ebookSrcs = draft._ebookPaths || [];
  // Local filesystem paths from the draft are tool input only — never
  // let them reach the committed, public record.
  delete record._coverPath;
  delete record._ebookPaths;
  for (const key of Object.keys(record)) {
    if (key.startsWith('_')) delete record[key];
  }
  if (coverSrc) {
    const dest = copyIntoDir(path.join(ROOT, 'assets/covers', record.slug), coverSrc, 'cover');
    if (dest) record.cover = path.relative(ROOT, dest);
  }
  if (ebookSrcs.length) {
    const stagingDir = path.join(ROOT, 'private/ebooks', record.slug);
    ebookSrcs.forEach((p, i) => copyIntoDir(stagingDir, p, ebookSrcs.length > 1 ? `book-${i + 1}` : 'book'));
  }
  fs.mkdirSync(path.join(ROOT, 'data/volumes'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data/volumes', `${record.slug}.json`), JSON.stringify(record, null, 2) + '\n');
  console.log(`  ✓ Wrote data/volumes/${record.slug}.json`);
  finishUp(record.slug);
  process.exit(process.exitCode || 0);
}

/* ----------------------------------------------------------- interactive */

async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q, { required = false, def = null } = {}) => {
    for (;;) {
      const suffix = def ? ` [${def}]` : required ? ' (required)' : ' (Enter to skip)';
      const a = (await rl.question(`${q}${suffix}: `)).trim();
      if (a) return a;
      if (def) return def;
      if (!required) return null;
      console.log('  This field is required.');
    }
  };
  const askChoice = async (q, options, { def = null, allowSkip = false } = {}) => {
    console.log(`${q}${allowSkip ? ' (Enter to skip)' : ''}`);
    options.forEach((o, i) => console.log(`    ${i + 1}. ${o}`));
    for (;;) {
      const a = (await rl.question(`  Choose 1-${options.length}${def ? ` [${def}]` : ''}: `)).trim();
      if (!a && def) return def;
      if (!a && allowSkip) return null;
      const n = Number(a);
      if (n >= 1 && n <= options.length) return options[n - 1];
      if (options.includes(a)) return a;
      console.log('  Not a valid choice.');
    }
  };
  const askList = async (q, allowed, { def = [] } = {}) => {
    const a = (await rl.question(`${q} [${allowed.join(', ')}] (comma-separated) [${def.join(',') || 'none'}]: `)).trim();
    const chosen = (a || def.join(',')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = chosen.filter((c) => !allowed.includes(c));
    if (bad.length) { console.log(`  Ignoring unrecognized: ${bad.join(', ')}`); }
    return chosen.filter((c) => allowed.includes(c));
  };

  console.log('\nRebel Archives — add an ebook');
  console.log('Answer the questions; press Enter to skip anything optional.');
  console.log('Reminder: the actual file never gets committed to this repo — it gets');
  console.log('staged locally for you, and sold from wherever you set up the listing.\n');

  const title = await ask('Title', { required: true });
  const subtitle = await ask('Subtitle');

  let slug;
  for (;;) {
    slug = await ask('Permanent slug (the book\'s forever-URL name)', { def: slugify(title) });
    if (!SLUG_PATTERN.test(slug)) { console.log('  Lowercase letters, numbers, and hyphens only.'); continue; }
    if (existingSlugs.has(slug)) { console.log(`  "${slug}" already exists — pick another.`); continue; }
    break;
  }

  console.log('\nAttribution. Add one line per role; leave the role empty to finish.');
  const roles = [];
  for (;;) {
    const role = await askChoice(roles.length ? 'Another role?' : 'First role (who wrote/compiled/archived this?)', ROLES, { allowSkip: roles.length > 0 });
    if (!role) break;
    const name = await ask(`  Name for "${role}"`, { required: true });
    roles.push({ role, name });
  }
  if (!roles.length) roles.push({ role: 'written-by', name: (await ask('  Author name', { required: true })) });

  const archiveType = await askChoice('Type', taxonomies.archiveTypes, { allowSkip: true });
  const collection = await askChoice('Collection', taxonomies.collections, { def: taxonomies.collections[0] || null, allowSkip: true });
  const description = await ask('Public summary (what a visitor reads before buying)', { required: true });
  const statement = await ask('Longer description / back-cover copy (optional)');
  const periodLabel = await ask('Date or period covered (e.g. 1994–2003)');
  const created = await ask('Date created (e.g. 2026-05)');
  const sources = await ask('Source information');
  const accessNotes = await ask('Access notes (e.g. "includes a bonus chapter")');
  const assetCredits = await ask('Asset/cover credits');
  const searchTermsRaw = await ask('Extra search terms (comma-separated)');

  const formats = await askList('Formats available', FORMATS, { def: ['pdf', 'epub'] });
  const price = await ask('Price to display (e.g. $14) — informational only, not charged here');
  const state = await askChoice('Publication state', STATES, { def: 'hidden-draft' });

  const coverPath = await ask('Path to the cover image on this computer');
  console.log('\nEbook file(s) to stage locally (never committed). One path per line, blank to finish.');
  const ebookPaths = [];
  for (;;) {
    const p = await ask(ebookPaths.length ? 'Another file' : 'File path');
    if (!p) break;
    ebookPaths.push(p);
  }

  const hasLink = (await ask('Already have the product live on your store? (y/N)', { def: 'n' })).toLowerCase().startsWith('y');
  let purchase = { kind: 'none', href: null, label: 'Purchase' };
  if (hasLink) {
    const href = await ask('  Product URL (https://…)', { required: true });
    const label = await ask('  Button label', { def: 'Purchase' });
    purchase = { kind: 'external', href, label };
  }

  rl.close();

  const record = normalizeVolume({
    slug, title, subtitle, roles, archiveType, collection,
    description, statement,
    period: { label: periodLabel, start: null, end: null },
    created, sources, accessNotes, assetCredits,
    searchTerms: searchTermsRaw ? searchTermsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
    formats, price, state, purchase
  });

  if (coverPath) {
    const dest = copyIntoDir(path.join(ROOT, 'assets/covers', slug), coverPath, 'cover');
    if (dest) { record.cover = path.relative(ROOT, dest); console.log(`  · Cover copied to ${record.cover}`); }
  }
  if (ebookPaths.length) {
    const stagingDir = path.join(ROOT, 'private/ebooks', slug);
    ebookPaths.forEach((p, i) => {
      const dest = copyIntoDir(stagingDir, p, ebookPaths.length > 1 ? `book-${i + 1}` : 'book');
      if (dest) console.log(`  · Staged ${path.relative(ROOT, dest)} (private, not committed)`);
    });
  }

  fs.mkdirSync(path.join(ROOT, 'data/volumes'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data/volumes', `${slug}.json`), JSON.stringify(record, null, 2) + '\n');
  console.log(`\n  ✓ Wrote data/volumes/${slug}.json`);
  finishUp(slug);
}

interactive();
