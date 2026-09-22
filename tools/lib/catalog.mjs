/* Reads the per-file catalog sources (data/volumes/*.json) and compiles
   the single generated index a future display will load:
   data/catalog-index.json. Never hand-edit the compiled file — it's
   regenerated from the source records every time tools/add-book.mjs or
   tools/validate.mjs runs. */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeVolume } from './schema.mjs';

export const GENERATED_WARNING =
  'GENERATED FILE — do not edit. Compiled from data/volumes/*.json by tools/validate.mjs (also runs at the end of tools/add-book.mjs). Hand edits are overwritten.';

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadVolumeFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((fileName) => {
      const file = path.join(dir, fileName);
      let record = null, parseError = null;
      try { record = normalizeVolume(readJson(file)); }
      catch (e) { parseError = e.message; }
      return { fileName, file, record, parseError };
    });
}

export function sortVolumes(records) {
  return [...records].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return String(a.title).localeCompare(String(b.title));
  });
}

export function compileIndex(root) {
  const site = readJson(path.join(root, 'data/site.json'));
  const taxonomies = readJson(path.join(root, 'data/taxonomies.json'));
  const files = loadVolumeFiles(path.join(root, 'data/volumes'));
  const volumes = sortVolumes(files.filter((v) => v.record).map((v) => v.record));

  const index = {
    generated: GENERATED_WARNING,
    schemaVersion: 1,
    site,
    taxonomies: { collections: taxonomies.collections, archiveTypes: taxonomies.archiveTypes },
    volumes
  };
  fs.writeFileSync(path.join(root, 'data/catalog-index.json'), JSON.stringify(index, null, 2) + '\n');
  return { index, files };
}
