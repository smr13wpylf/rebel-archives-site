#!/usr/bin/env node
/* Validates the ebook catalog: record schema, slugs, taxonomies, formats,
   purchase links, and attribution. Also regenerates data/catalog-index.json
   so it never drifts from the source records. Exits non-zero on error.

   Usage: node tools/validate.mjs
   Library: import { runValidation } from './validate.mjs'           */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVolume } from './lib/schema.mjs';
import { readJson, loadVolumeFiles, compileIndex } from './lib/catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runValidation(root = ROOT) {
  const errors = [];
  const warnings = [];
  const taxonomies = readJson(path.join(root, 'data/taxonomies.json'));
  const files = loadVolumeFiles(path.join(root, 'data/volumes'));

  const seenSlugs = new Map();
  for (const { fileName, record, parseError, file } of files) {
    const where = path.relative(root, file);
    if (parseError) { errors.push(`${where}: invalid JSON — ${parseError}`); continue; }
    errors.push(...validateVolume(record, { taxonomies, fileName }).map((e) => `${where}: ${e}`));
    if (record.slug) {
      if (seenSlugs.has(record.slug)) {
        errors.push(`${where}: duplicate slug "${record.slug}" (also in ${seenSlugs.get(record.slug)})`);
      } else {
        seenSlugs.set(record.slug, where);
      }
    }
  }

  // referenced public assets (cover) must exist; the actual ebook file is
  // intentionally NEVER referenced from here (see schema.mjs security note)
  for (const { record } of files) {
    if (!record) continue;
    if (record.cover && !fs.existsSync(path.join(root, record.cover))) {
      errors.push(`${record.slug}: cover points to a missing file: ${record.cover}`);
    }
    for (const rel of record.related) {
      if (!seenSlugs.has(rel)) errors.push(`${record.slug}: related slug "${rel}" does not exist in the catalog`);
    }
  }

  // guard against the actual ebook file ever ending up somewhere committed
  const publicDirs = ['assets', 'data', 'css', 'js', 'icons'];
  for (const dir of publicDirs) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of walk(full)) {
      if (/\.(pdf|epub|mobi|azw3?)$/i.test(f)) {
        errors.push(`${path.relative(root, f)}: an ebook file is sitting in a public/committed folder — move it to private/ebooks/<slug>/ instead (see ADDING-A-BOOK.md)`);
      }
    }
  }

  compileIndex(root);

  return { errors, warnings, counts: { production: files.filter((v) => v.record).length } };
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings, counts } = runValidation();
  for (const w of warnings) console.log('  warn ', w);
  for (const e of errors) console.log('  ERROR', e);
  console.log(`\nCatalog: ${counts.production} volume(s). data/catalog-index.json regenerated.`);
  if (errors.length) {
    console.log(`Validation FAILED with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log('Validation passed.');
}
