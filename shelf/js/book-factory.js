/* Procedural clothbound hardcovers: parametric case geometry plus a
   canvas-painted atlas (cloth grain, hinge grooves, foil motifs, serif
   titling) and a matching roughness/metalness map so the foil catches light.

   Book local frame (the spatial contract shared with assets.js):
   origin at the bottom-centre of the spine, spine bulging toward +Z,
   pages extending toward -Z, up is +Y, thickness along X. */

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import { SHELF_UNIT } from './catalog.js';

const BOARD_T = 0.005;   // board thickness (m)
const OVERHANG = 0.004;  // board "square" past the text block (m)
const SPINE_BULGE = 0.62; // z-scale of the half-round spine

const ATLAS_W = 1024, ATLAS_H = 512;
const R_FRONT = { x: 8, y: 8, w: 424, h: 496 };
const R_BACK = { x: 440, y: 8, w: 424, h: 496 };
const R_SPINE = { x: 872, y: 8, w: 72, h: 496 };
const R_PAGES = { x: 952, y: 8, w: 28, h: 496 };
const R_CLOTH = { x: 988, y: 8, w: 28, h: 240 };
const R_END = { x: 988, y: 260, w: 28, h: 244 };

/* ---------------------------------------------------------------- utils */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `rgb(${r},${g},${b})`;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Region-relative UV with a small inset so mipmaps never bleed neighbours.
// fu runs left→right in the painted atlas, fv runs bottom→top of the book.
function regionUV(r, fu, fv) {
  fu = 0.015 + Math.min(1, Math.max(0, fu)) * 0.97;
  fv = 0.015 + Math.min(1, Math.max(0, fv)) * 0.97;
  return [
    (r.x + fu * r.w) / ATLAS_W,
    1 - (r.y + (1 - fv) * r.h) / ATLAS_H // CanvasTexture flipY: v=1 is canvas top
  ];
}

/* ------------------------------------------------------------- geometry */

const geoCache = new Map();

function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

// Rewrites every UV by the vertex's dominant normal axis. `pick` returns
// [region, fu, fv] given (axis, sign, localPosition).
function remapUVs(geo, pick) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    const axis = ax >= ay && ax >= az ? 'x' : (ay >= az ? 'y' : 'z');
    const sign = { x: n.x, y: n.y, z: n.z }[axis] >= 0 ? 1 : -1;
    const [r, fu, fv] = pick(axis, sign, p);
    const [u, v] = regionUV(r, fu, fv);
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

function boardGeometry(which, H, W) {
  return cached(`board|${which}|${H.toFixed(4)}|${W.toFixed(4)}`, () => {
    const geo = new RoundedBoxGeometry(BOARD_T, H, W, 2, 0.0028);
    // Local: x∈±BOARD_T/2, y∈±H/2, z∈±W/2. Mesh is placed so local +z is
    // the spine edge (book z=0) and −z the fore-edge.
    return remapUVs(geo, (axis, sign, p) => {
      const fy = p.y / H + 0.5;
      const fz = p.z / W + 0.5; // 1 at spine edge, 0 at fore-edge
      if (axis === 'x') {
        const outerFront = which === 'front' && sign > 0;
        const outerBack = which === 'back' && sign < 0;
        if (outerFront) return [R_FRONT, 1 - fz, fy]; // spine on the left
        if (outerBack) return [R_BACK, fz, fy];       // spine on the right
        return [R_END, fz, fy];                        // pastedown side
      }
      if (axis === 'y') return [R_CLOTH, fz, p.x / BOARD_T + 0.5];
      return [R_CLOTH, p.x / BOARD_T + 0.5, fy];       // thin z-strips
    });
  });
}

function spineGeometry(H, T) {
  return cached(`spine|${H.toFixed(4)}|${T.toFixed(4)}`, () => {
    const geo = new THREE.CylinderGeometry(T / 2, T / 2, H, 16, 1, true, -Math.PI / 2, Math.PI);
    // u already runs 0→1 across the arc (−X to +X, i.e. screen left→right
    // for the browse camera), v runs bottom→top.
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const [u, v] = regionUV(R_SPINE, uv.getX(i), uv.getY(i));
      uv.setXY(i, u, v);
    }
    // Shallow arc: squash the bulge, lift so the base sits at y=0.
    geo.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, SPINE_BULGE));
    geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, H / 2, 0));
    return geo;
  });
}

function blockGeometry(H, W, T) {
  const TB = T - 2 * BOARD_T, HB = H - 2 * OVERHANG, WB = W - OVERHANG;
  return cached(`block|${H.toFixed(4)}|${W.toFixed(4)}|${T.toFixed(4)}`, () => {
    const geo = new THREE.BoxGeometry(TB, HB, WB);
    return remapUVs(geo, (axis, sign, p) => {
      const fx = p.x / TB + 0.5, fy = p.y / HB + 0.5, fz = p.z / WB + 0.5;
      if (axis === 'y') return [R_PAGES, fx, fz];       // top/bottom leaf edges
      if (axis === 'z' && sign < 0) return [R_PAGES, fx, fy]; // fore-edge
      if (axis === 'z') return [R_CLOTH, fx, fy];       // glued spine side, hidden
      return [R_END, fz, fy];                            // faces against the boards
    });
  });
}

/* ------------------------------------------------------------- painting */

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = makeCanvas(128, 128);
  const g = c.getContext('2d');
  const rng = mulberry32(7);
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = rng() < 0.5 ? 'rgba(255,252,240,0.05)' : 'rgba(20,12,4,0.06)';
    g.fillRect(rng() * 128, rng() * 128, rng() < 0.8 ? 1 : 2, 1);
  }
  g.strokeStyle = 'rgba(20,12,4,0.03)';
  for (let y = 0; y < 128; y += 3) {
    g.beginPath(); g.moveTo(0, y + rng()); g.lineTo(128, y); g.stroke();
  }
  grainTile = c;
  return c;
}

function paintClothBase(ctx, r, P) {
  ctx.fillStyle = P.cloth;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (P.isPBR) return;
  const pat = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.fillStyle = pat;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillRect(-r.h / 2, -r.w / 2, r.h, r.w);
  ctx.restore();
  // soft darkening toward every edge
  const edges = [
    [r.x, r.y, r.x, r.y + 16, r.x, r.y, r.w, 16],
    [r.x, r.y + r.h, r.x, r.y + r.h - 16, r.x, r.y + r.h - 16, r.w, 16],
    [r.x, r.y, r.x + 14, r.y, r.x, r.y, 14, r.h],
    [r.x + r.w, r.y, r.x + r.w - 14, r.y, r.x + r.w - 14, r.y, 14, r.h]
  ];
  for (const [gx0, gy0, gx1, gy1, fx, fy, fw, fh] of edges) {
    const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    grad.addColorStop(0, 'rgba(15,9,3,0.12)');
    grad.addColorStop(1, 'rgba(15,9,3,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(fx, fy, fw, fh);
  }
}

function hingeGroove(ctx, r, side, P) {
  if (P.isPBR) return;
  const x = side === 'left' ? r.x + 10 : r.x + r.w - 13;
  ctx.fillStyle = 'rgba(15,9,3,0.20)';
  ctx.fillRect(x, r.y, 3, r.h);
  ctx.fillStyle = 'rgba(255,250,235,0.10)';
  ctx.fillRect(side === 'left' ? x + 3 : x - 2, r.y, 2, r.h);
}

// Draws fn twice — once nudged dark (the stamp deboss), once in foil.
function foil(ctx, P, fn) {
  if (!P.isPBR) {
    ctx.save(); ctx.translate(1.2, 1.5);
    fn('rgba(22,13,5,0.55)');
    ctx.restore();
  }
  fn(P.foil);
}

/* Six parametric foil motifs. Each draws centred at (cx, cy) within radius s. */
const MOTIFS = {
  sunburst(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4;
    for (let i = 0; i < 15; i++) {
      const a = Math.PI + (i / 14) * Math.PI; // upper fan
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * s * 0.42, cy + Math.sin(a) * s * 0.42);
      ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.07, 0, Math.PI * 2); ctx.fill();
  },
  rings(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color;
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = i === 0 ? 3 : 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, s * (0.34 + i * 0.22), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.fill();
  },
  lozenge(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color;
    for (const [k, w] of [[1, 2.6], [0.72, 1.4]]) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * k); ctx.lineTo(cx + s * 0.62 * k, cy);
      ctx.lineTo(cx, cy + s * k); ctx.lineTo(cx - s * 0.62 * k, cy);
      ctx.closePath(); ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2); ctx.fill();
  },
  rules(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color;
    for (let i = -1; i <= 1; i++) {
      ctx.lineWidth = i === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + i * s * 0.34 + s * 0.42);
      ctx.lineTo(cx + s, cy + i * s * 0.34 - s * 0.42);
      ctx.stroke();
    }
  },
  waves(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = cx - s + (i / 40) * s * 2;
        const y = cy + j * s * 0.34 + Math.sin((i / 40) * Math.PI * 3) * s * 0.16;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  },
  orbits(ctx, cx, cy, s, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.6;
    for (const [rx, ry, rot] of [[1, 0.38, 0], [1, 0.38, Math.PI / 3], [1, 0.38, -Math.PI / 3]]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * rx, s * ry, rot, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.10, 0, Math.PI * 2); ctx.fill();
  }
};

function trackedText(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + spacing;
  }
  return total;
}

function wrapWords(ctx, text, maxWidth, spacing) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  const measure = (s) => ctx.measureText(s).width + spacing * Math.max(0, s.length - 1);
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (line && measure(next) > maxWidth) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawCover(ctx, r, def, P, rng) {
  paintClothBase(ctx, r, P);
  hingeGroove(ctx, r, 'left', P);
  const cx = r.x + r.w / 2;
  foil(ctx, P, (color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 26, r.y + 26, r.w - 52, r.h - 52);
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 34, r.y + 34, r.w - 68, r.h - 68);
  });
  const s = r.w * (0.19 + rng() * 0.05);
  const my = r.y + r.h * (0.335 + rng() * 0.04);
  foil(ctx, P, (color) => MOTIFS[def.motif](ctx, cx, my, s, color));
  // title block
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = '400 27px Georgia, "Times New Roman", serif';
  const lines = wrapWords(ctx, def.title.toUpperCase(), r.w - 110, 3);
  const ty = r.y + r.h * 0.62;
  foil(ctx, P, (color) => {
    ctx.fillStyle = color;
    ctx.font = '400 27px Georgia, "Times New Roman", serif';
    lines.forEach((ln, i) => trackedText(ctx, ln, cx, ty + i * 36, 3));
    const ry = ty + lines.length * 36 - 16;
    ctx.fillRect(cx - 32, ry, 64, 1.6);
    ctx.font = 'italic 400 19px Georgia, "Times New Roman", serif';
    trackedText(ctx, def.author, cx, ry + 34, 1.5);
  });
}

function drawBack(ctx, r, def, P, rng) {
  paintClothBase(ctx, r, P);
  hingeGroove(ctx, r, 'right', P);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  foil(ctx, P, (color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(r.x + 26, r.y + 26, r.w - 52, r.h - 52);
    MOTIFS[def.motif](ctx, cx, cy, r.w * 0.10, color);
  });
}

function drawSpine(ctx, r, def, P, rng) {
  paintClothBase(ctx, r, P);
  const cx = r.x + r.w / 2;
  foil(ctx, P, (color) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    // head and tail double rules
    for (const y of [r.y + 22, r.y + 27]) { ctx.fillRect(r.x + 8, y, r.w - 16, 1.6); }
    for (const y of [r.y + r.h - 24, r.y + r.h - 29]) { ctx.fillRect(r.x + 8, y, r.w - 16, 1.6); }
    MOTIFS[def.motif](ctx, cx, r.y + 58, r.w * 0.26, color);
  });
  // running title, rotated to read top-to-bottom
  ctx.save();
  ctx.translate(cx, r.y + 96);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let title = def.title.toUpperCase();
  const maxLen = r.h - 185;
  // shrink to fit before resorting to an ellipsis
  let size = Math.min(26, r.w * 0.4);
  const fits = () => ctx.measureText(title).width + 2 * title.length <= maxLen;
  ctx.font = `400 ${size}px Georgia, "Times New Roman", serif`;
  while (size > 15 && !fits()) {
    size -= 1;
    ctx.font = `400 ${size}px Georgia, "Times New Roman", serif`;
  }
  while (title.length > 4 && !fits()) {
    title = title.slice(0, -2).trimEnd() + '…';
  }
  foil(ctx, P, (color) => {
    ctx.fillStyle = color;
    let x = 0;
    for (const ch of title) { ctx.fillText(ch, x, 0); x += ctx.measureText(ch).width + 2; }
  });
  ctx.restore();
  // author initials at the foot
  const initials = def.author.split(' ').map((w) => w[0]).join('.') + '.';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  foil(ctx, P, (color) => {
    ctx.fillStyle = color;
    ctx.font = `400 ${Math.min(15, r.w * 0.24)}px Georgia, serif`;
    trackedText(ctx, initials, cx, r.y + r.h - 40, 1);
  });
}

function drawPages(ctx, r, def, P, rng) {
  ctx.fillStyle = P.pages;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (P.isPBR) return;
  for (let x = r.x + 1; x < r.x + r.w - 1; x += 1.5) {
    ctx.strokeStyle = `rgba(120,100,70,${0.06 + rng() * 0.16})`;
    ctx.beginPath();
    ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h);
    ctx.stroke();
  }
  const grad = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
  grad.addColorStop(0, 'rgba(90,70,45,0.18)');
  grad.addColorStop(0.5, 'rgba(90,70,45,0)');
  grad.addColorStop(1, 'rgba(90,70,45,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function paintAtlas(def, mode) {
  const scale = mode === 'albedo' ? 1 : 0.5;
  const canvas = makeCanvas(ATLAS_W * scale, ATLAS_H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const P = mode === 'albedo'
    ? {
        isPBR: false,
        cloth: def.cloth,
        foil: def.foil,
        pages: '#efe6d2',
        end: def.accent
      }
    : {
        // Channel-packed for MeshStandardMaterial: G = roughness, B = metalness.
        isPBR: true,
        cloth: 'rgb(0,225,0)',
        foil: 'rgb(0,95,100)',
        pages: 'rgb(0,238,0)',
        end: 'rgb(0,235,0)'
      };
  const rng = mulberry32(hashString(def.id));
  drawCover(ctx, R_FRONT, def, P, rng);
  drawBack(ctx, R_BACK, def, P, rng);
  drawSpine(ctx, R_SPINE, def, P, rng);
  drawPages(ctx, R_PAGES, def, P, rng);
  paintClothBase(ctx, R_CLOTH, P);
  ctx.fillStyle = P.end;
  ctx.fillRect(R_END.x, R_END.y, R_END.w, R_END.h);
  return canvas;
}

/* ------------------------------------------------------------- assembly */

export function buildProceduralBook(def, opts = {}) {
  const H = def.height * SHELF_UNIT;
  const W = def.width * SHELF_UNIT;
  const T = def.thickness * SHELF_UNIT;

  const albedo = new THREE.CanvasTexture(paintAtlas(def, 'albedo'));
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = opts.anisotropy || 4;
  const pbr = new THREE.CanvasTexture(paintAtlas(def, 'pbr'));
  pbr.anisotropy = opts.anisotropy || 4;

  const material = new THREE.MeshStandardMaterial({
    map: albedo,
    roughnessMap: pbr,
    metalnessMap: pbr,
    roughness: 1,
    metalness: 1
  });

  const group = new THREE.Group();
  group.name = def.id;

  const front = new THREE.Mesh(boardGeometry('front', H, W), material);
  front.position.set(T / 2 - BOARD_T / 2, H / 2, -W / 2);
  const back = new THREE.Mesh(boardGeometry('back', H, W), material);
  back.position.set(-(T / 2 - BOARD_T / 2), H / 2, -W / 2);
  const spine = new THREE.Mesh(spineGeometry(H, T), material);
  const block = new THREE.Mesh(blockGeometry(H, W, T), material);
  block.position.set(0, H / 2, -(W - OVERHANG) / 2);

  group.add(front, back, spine, block);
  group.userData.size = { H, W, T };
  return group;
}
