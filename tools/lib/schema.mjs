/* Ebook volume-record schema: constants, normalization, and validation.

   Roles, states, and formats are fixed here on purpose — roles/states
   affect attribution accuracy and public visibility; formats are a small
   fixed technical set. Collections and archive types are editable
   vocabularies in data/taxonomies.json.

   SECURITY BOUNDARY: everything in a data/volumes/<slug>.json record is
   committed to git and ends up on the public GitHub Pages deployment.
   Never put a real file, a private URL, or anything access-controlled in
   here — only public-safe summary/marketing content and a link out to
   wherever the book is actually sold. The real ebook files live under
   private/ebooks/ and are gitignored; see ADDING-A-BOOK.md. */

export const ROLES = [
  'written-by', 'compiled-by', 'archived-by', 'edited-by',
  'researched-by', 'transcribed-by', 'subject', 'original-author'
];

export const ROLE_LABELS = {
  'written-by': 'Written by',
  'compiled-by': 'Compiled by',
  'archived-by': 'Archived by',
  'edited-by': 'Edited by',
  'researched-by': 'Researched by',
  'transcribed-by': 'Transcribed by',
  'subject': 'Subject',
  'original-author': 'Original author'
};

// hidden-draft = staged locally only, never appears in any public/deployed
// view once a display exists. Sensible default while a title is still
// being prepared and has no live purchase link yet.
export const STATES = [
  'public', 'portfolio-preview', 'private', 'forthcoming',
  'active-research', 'archived', 'hidden-draft'
];

export const STATE_LABELS = {
  'public': 'Public',
  'portfolio-preview': 'Portfolio preview',
  'private': 'Private collection',
  'forthcoming': 'Forthcoming',
  'active-research': 'Active research',
  'archived': 'Archived',
  'hidden-draft': 'Hidden draft'
};

export const FORMATS = ['pdf', 'epub', 'mobi', 'other'];
export const FORMAT_LABELS = { pdf: 'PDF', epub: 'EPUB', mobi: 'MOBI/Kindle', other: 'Other' };

// The ebook file is never hosted by this site (static GitHub Pages has no
// access control). 'external' points to the third-party store's product
// page; 'none' means no live purchase link yet (still staging the title).
export const PURCHASE_KINDS = ['external', 'none'];

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Fills defaults; returns a new normalized record. Throws nothing. */
export function normalizeVolume(raw) {
  const v = { ...raw };
  v.subtitle ??= null;
  v.roles = Array.isArray(v.roles) ? v.roles : [];
  v.archiveType ??= null;
  v.collection ??= null;
  v.series ??= null;
  v.description ??= '';
  v.statement ??= null;
  v.topics = Array.isArray(v.topics) ? v.topics : [];
  v.people = Array.isArray(v.people) ? v.people : [];
  v.period = v.period && typeof v.period === 'object' ? v.period : { label: null, start: null, end: null };
  v.created ??= null;
  v.state ??= 'hidden-draft';
  v.featured = !!v.featured;
  v.order = typeof v.order === 'number' ? v.order : null;
  v.related = Array.isArray(v.related) ? v.related : [];

  v.formats = Array.isArray(v.formats) ? v.formats : [];
  v.price ??= null;

  const p = v.purchase && typeof v.purchase === 'object' ? v.purchase : {};
  v.purchase = {
    kind: p.kind || 'none',
    href: p.href ?? null,
    label: p.label || 'Purchase'
  };

  v.cover ??= null;
  v.sources ??= null;
  v.accessNotes ??= null;
  v.assetCredits ??= null;
  v.searchTerms = Array.isArray(v.searchTerms) ? v.searchTerms : [];
  v.credits ??= null;
  return v;
}

/**
 * Validates one normalized record. Returns an array of error strings
 * (empty = valid). `ctx` may carry { taxonomies, fileName }.
 */
export function validateVolume(v, ctx = {}) {
  const errors = [];
  const label = v.slug || ctx.fileName || '(unknown record)';
  const err = (msg) => errors.push(`${label}: ${msg}`);

  if (!v.slug || !SLUG_PATTERN.test(v.slug)) {
    err(`slug "${v.slug}" is missing or invalid (lowercase letters, numbers, hyphens)`);
  }
  if (ctx.fileName && v.slug && ctx.fileName !== `${v.slug}.json`) {
    err(`file name "${ctx.fileName}" must match the slug ("${v.slug}.json")`);
  }
  if (!v.title || !String(v.title).trim()) err('title is required');
  if (!v.description || !String(v.description).trim()) err('description (the public summary) is required');

  if (!v.roles.length) {
    err('at least one attribution role is required');
  }
  for (const r of v.roles) {
    if (!r || typeof r !== 'object' || !r.role || !r.name) {
      err(`each role needs { role, name } (got ${JSON.stringify(r)})`);
    } else if (!ROLES.includes(r.role)) {
      err(`unknown role "${r.role}" (allowed: ${ROLES.join(', ')})`);
    }
  }

  if (!STATES.includes(v.state)) {
    err(`unknown state "${v.state}" (allowed: ${STATES.join(', ')})`);
  }

  const tax = ctx.taxonomies || { collections: [], archiveTypes: [] };
  if (v.archiveType !== null && !tax.archiveTypes.includes(v.archiveType)) {
    err(`archiveType "${v.archiveType}" is not in data/taxonomies.json (add it there first)`);
  }
  if (v.collection !== null && !tax.collections.includes(v.collection)) {
    err(`collection "${v.collection}" is not in data/taxonomies.json (add it there first)`);
  }

  if (!v.formats.length) {
    err('at least one format is required (pdf, epub, mobi, or other)');
  }
  for (const f of v.formats) {
    if (!FORMATS.includes(f)) err(`unknown format "${f}" (allowed: ${FORMATS.join(', ')})`);
  }

  if (!PURCHASE_KINDS.includes(v.purchase.kind)) {
    err(`unknown purchase.kind "${v.purchase.kind}" (allowed: ${PURCHASE_KINDS.join(', ')})`);
  }
  if (v.purchase.kind === 'external') {
    if (!/^https:\/\//.test(v.purchase.href || '')) {
      err('purchase.href must be an https:// URL (your store\'s product page) when purchase.kind is "external"');
    }
  }
  // A public/for-sale state with no live purchase link is a real content
  // bug (a visitor would see "Purchase" with nowhere to go), not just a
  // style nit — catch it here.
  if (v.state === 'public' && v.purchase.kind === 'none') {
    err('state is "public" but purchase.kind is "none" — add the store link (or keep the state as "forthcoming"/"hidden-draft" until it\'s ready)');
  }

  // Defense in depth: a stray tool-only key (e.g. a leftover _coverPath /
  // _ebookPaths from a hand-edited draft) or a raw local filesystem path
  // anywhere in the record must never reach a committed, public file.
  for (const key of Object.keys(v)) {
    if (key.startsWith('_')) err(`stray "${key}" field — tool-only keys must not be saved into the record`);
  }
  const LOCAL_PATH_RE = /^(\/(home|tmp|Users|root)\/|[A-Za-z]:\\)/;
  const walkStrings = (node, at) => {
    if (typeof node === 'string') {
      if (LOCAL_PATH_RE.test(node)) err(`${at} looks like a local filesystem path ("${node}") — only committed, repo-relative paths (like assets/covers/...) belong in a record`);
    } else if (Array.isArray(node)) {
      node.forEach((item, i) => walkStrings(item, `${at}[${i}]`));
    } else if (node && typeof node === 'object') {
      for (const [k, val] of Object.entries(node)) walkStrings(val, `${at}.${k}`);
    }
  };
  walkStrings(v, 'record');

  return errors;
}
