/* Asset seam for the shelf.

   SPATIAL CONTRACT — every book asset, however produced, is delivered as a
   THREE.Group whose origin sits at the bottom-centre of the spine, spine
   facing +Z (toward the browse camera), up +Y, thickness along X, and whose
   bounding size matches the catalog entry's width × height × thickness in
   shelf units (see SHELF_UNIT). `group.userData.size = { H, W, T }` in
   world metres.

   Today every catalog entry is `asset: { kind: 'procedural' }` and routes
   to book-factory.js. When a generated hardcover replaces one (e.g. a Mint
   asset synced into the repo via its artifact-manifest pipeline —
   generation happens at build time, never from browser code), switch that
   entry to `asset: { kind: 'glb', url: '…' }`, vendor a Draco-capable
   GLTFLoader, and implement the 'glb' branch to load, recentre, and rescale
   the model to this contract. Nothing outside this module changes. */

import * as THREE from 'three';
import { buildProceduralBook } from './book-factory.js';

export async function acquireBook(def, opts = {}) {
  switch (def.asset.kind) {
    case 'procedural':
      return buildProceduralBook(def, opts);
    case 'glb':
      throw new Error(`GLB assets not wired yet (asset ${def.id}); see the contract note above.`);
    default:
      throw new Error(`Unknown asset kind "${def.asset.kind}" for ${def.id}`);
  }
}
