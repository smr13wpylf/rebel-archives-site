/* The room: cream paper backdrop, a continuous walnut shelf, warm light.
   No shadow maps — contact shadows are a painted strip, ambient occlusion
   is painted straight into the walnut. */

import * as THREE from 'three';

export const PAPER = 0xf3ecdd;

const BOARD_TOP = 0;        // books stand on y = 0
const BOARD_THICK = 0.032;
const BOARD_FRONT_Z = 0.09; // shelf lip in front of the spines
const BOARD_BACK_Z = -0.27;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function walnutTexture(repeatX) {
  const c = makeCanvas(512, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#5a4030';
  g.fillRect(0, 0, 512, 256);
  // long grain streaks
  for (let i = 0; i < 140; i++) {
    const y = Math.random() * 256;
    const light = Math.random() < 0.45;
    g.strokeStyle = light
      ? `rgba(140,104,74,${0.05 + Math.random() * 0.1})`
      : `rgba(30,18,10,${0.06 + Math.random() * 0.12})`;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    g.beginPath();
    g.moveTo(-20, y);
    g.bezierCurveTo(150, y + (Math.random() - 0.5) * 14, 360, y + (Math.random() - 0.5) * 14, 532, y + (Math.random() - 0.5) * 8);
    g.stroke();
  }
  // fine speckle
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(25,15,8,${0.05 + Math.random() * 0.08})`;
    g.fillRect(Math.random() * 512, Math.random() * 256, 1 + Math.random() * 2, 1);
  }
  // soft depth band along the back edge (top edge of the canvas)
  const ao = g.createLinearGradient(0, 0, 0, 70);
  ao.addColorStop(0, 'rgba(15,8,4,0.26)');
  ao.addColorStop(1, 'rgba(15,8,4,0)');
  g.fillStyle = ao;
  g.fillRect(0, 0, 512, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, 1);
  return tex;
}

function contactShadowTexture() {
  const c = makeCanvas(64, 256);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(20,12,6,0.34)');
  grad.addColorStop(0.55, 'rgba(20,12,6,0.16)');
  grad.addColorStop(1, 'rgba(20,12,6,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}

export function buildEnvironment(scene, shelfLength) {
  scene.background = new THREE.Color(PAPER);
  scene.fog = new THREE.Fog(PAPER, 0.8, 1.7);

  // Books float against open cream paper; the only furniture is the board.
  // Extra length pushes the board's end faces deep into the fog.
  const boardLength = shelfLength + 1.4;
  const walnut = new THREE.MeshStandardMaterial({
    map: walnutTexture(Math.round(boardLength / 0.5)),
    roughness: 0.62,
    metalness: 0
  });
  const walnutPlain = new THREE.MeshStandardMaterial({ color: 0x4c3628, roughness: 0.66 });

  // shelf board
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(boardLength, BOARD_THICK, BOARD_FRONT_Z - BOARD_BACK_Z),
    [walnutPlain, walnutPlain, walnut, walnutPlain, walnutPlain, walnutPlain]
  );
  board.position.set(0, BOARD_TOP - BOARD_THICK / 2, (BOARD_FRONT_Z + BOARD_BACK_Z) / 2);
  scene.add(board);

  // painted contact shadow under the row of books
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(boardLength, 0.2),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(),
      transparent: true,
      depthWrite: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, BOARD_TOP + 0.0006, -0.155);
  scene.add(shadow);

  // warm editorial light: cream hemisphere, warm key, cool fill
  scene.add(new THREE.HemisphereLight(0xf7f0e2, 0x8a6f52, 0.95));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.7);
  key.position.set(-0.6, 1.1, 0.9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8ecf0, 0.4);
  fill.position.set(0.8, 0.4, 0.6);
  scene.add(fill);

  return { key, fill };
}
