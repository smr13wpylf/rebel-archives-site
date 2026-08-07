/* The Complete Shelf — bootstrap. Renderer, scene, the RAF loop, resize,
   and the tiny window.__shelf hook the smoke tests read. */

import * as THREE from 'three';
import { BOOKS } from './catalog.js';
import { acquireBook } from './assets.js';
import { buildEnvironment } from './environment.js';
import { ShelfInteractions, GAP } from './interactions.js';
import { createUI } from './ui.js';

const canvas = document.getElementById('stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const hook = { ready: false, state: 'browse', pos: 0, selectedIndex: 0, cameraQuat: [0, 0, 0, 1] };
window.__shelf = hook;

async function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 10);

  buildEnvironment(scene, (BOOKS.length - 1) * GAP + 0.9);

  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const books = [];
  for (const def of BOOKS) {
    const group = await acquireBook(def, { anisotropy });
    scene.add(group);
    books.push({ def, group });
  }

  const ui = createUI(BOOKS, reducedMotion);
  const interactions = new ShelfInteractions(camera, canvas, books, {
    reducedMotion,
    onSelectionChange: ui.onSelectionChange,
    onStateChange: ui.onStateChange
  });
  ui.bind(interactions);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    interactions.update(clock.getDelta());
    renderer.render(scene, camera);
    hook.ready = true;
    hook.state = interactions.state;
    hook.pos = interactions.pos;
    hook.selectedIndex = interactions.selectedIndex;
    hook.cameraQuat = camera.quaternion.toArray();
  });
}

boot().catch((err) => {
  console.error('The Complete Shelf failed to start:', err);
  const p = document.createElement('p');
  p.className = 'noscript';
  p.textContent = 'This browser could not start the 3D shelf (WebGL required).';
  document.body.appendChild(p);
});

// Offline support: same registration rules as the writing studio.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('../sw.js').catch(() => { /* best-effort */ });
}
