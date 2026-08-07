/* All motion state for the shelf: the browse position integrator (drag,
   wheel, keys, markers all feed one scalar), the browse↔inspect state
   machine, the transition tweens, and the inspect-mode OrbitControls. */

import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

export const GAP = 0.085; // shelf spacing between book origins (m)

const EYE_Y = 0.175, EYE_Z = 0.60, LOOK_Y = 0.125;
const PULL_Z = 0.02;      // how far the selected spine eases forward
const SNAP_RATE = 8, CAM_RATE = 9, PULL_RATE = 6;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class ShelfInteractions {
  /**
   * @param books array of { def, group } — groups already follow the
   *   spatial contract in assets.js; this class owns their placement.
   */
  constructor(camera, canvas, books, opts = {}) {
    this.camera = camera;
    this.canvas = canvas;
    this.books = books;
    this.reduced = !!opts.reducedMotion;
    this.onSelectionChange = opts.onSelectionChange || (() => {});
    this.onStateChange = opts.onStateChange || (() => {});

    this.n = books.length;
    books.forEach((b, i) => {
      b.homeX = (i - (this.n - 1) / 2) * GAP;
      b.group.position.set(b.homeX, 0, 0);
      b.group.traverse((o) => { if (o.isMesh) o.userData.bookIndex = i; });
    });
    this.meshes = books.flatMap((b) => b.group.children);

    this.state = 'browse';
    this.pos = 0;
    this.vel = 0;
    this.snapTarget = 0;
    this.selectedIndex = -1;
    this.dragging = false;
    this.pointer = { x: 0, y: 0 };
    this.tweens = [];
    this.raycaster = new THREE.Raycaster();

    this.controls = new OrbitControls(camera, canvas);
    this.controls.enabled = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.8;
    this.controls.panSpeed = 0.6;
    this.controls.zoomSpeed = 0.9;
    this.controls.screenSpacePanning = true;
    this.controls.minPolarAngle = 0.3;
    this.controls.maxPolarAngle = 2.7;
    this.anchor = new THREE.Vector3();
    this.panMax = 0.12;

    // browse camera starts on book 0
    camera.position.set(this.camX(0), EYE_Y, EYE_Z);
    camera.lookAt(this.camX(0), LOOK_Y, 0);

    this.bindInput();
    this.setSelected(0);
  }

  camX(pos) { return (pos - (this.n - 1) / 2) * GAP; }
  clampIndex(i) { return Math.max(0, Math.min(this.n - 1, Math.round(i))); }

  setSelected(i) {
    if (i === this.selectedIndex) return;
    this.selectedIndex = i;
    this.onSelectionChange(i, this.books[i].def);
  }

  setState(s) {
    this.state = s;
    this.onStateChange(s);
  }

  /* ------------------------------------------------------------ input */

  bindInput() {
    const c = this.canvas;
    const dragUnitsPerPx = () => 3.2 / Math.max(320, c.clientWidth);

    let startX = 0, startPos = 0, moved = 0, lastX = 0, lastT = 0, pxVel = 0;

    c.addEventListener('pointerdown', (e) => {
      if (this.state !== 'browse' || !e.isPrimary) return;
      c.setPointerCapture(e.pointerId);
      this.dragging = true;
      this.snapTarget = null;
      this.vel = 0;
      startX = lastX = e.clientX;
      startPos = this.pos;
      moved = 0;
      pxVel = 0;
      lastT = performance.now();
      c.classList.add('dragging');
    });

    c.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!this.dragging || !e.isPrimary) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      const raw = startPos - dx * dragUnitsPerPx();
      this.pos = this.softClamp(raw);
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      pxVel = 0.6 * pxVel + 0.4 * ((e.clientX - lastX) / dt) * 1000;
      lastX = e.clientX;
      lastT = now;
    });

    const endDrag = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      c.classList.remove('dragging');
      if (moved < 6) {
        this.handleTap(e);
      } else if (!this.reduced) {
        this.vel = THREE.MathUtils.clamp(-pxVel * dragUnitsPerPx(), -5, 5);
      } else {
        this.snapTarget = this.clampIndex(this.pos);
      }
    };
    c.addEventListener('pointerup', endDrag);
    c.addEventListener('pointercancel', endDrag);

    c.addEventListener('wheel', (e) => {
      if (this.state !== 'browse') return; // OrbitControls owns the wheel while inspecting
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const px = e.deltaMode === 1 ? d * 16 : e.deltaMode === 2 ? d * 100 : d;
      if (this.reduced) {
        this.snapTarget = this.clampIndex((this.snapTarget ?? Math.round(this.pos)) + Math.sign(px));
        return;
      }
      this.snapTarget = null;
      this.vel = THREE.MathUtils.clamp(this.vel + px * 0.0035, -5, 5);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (this.state === 'browse') {
        if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); this.openInspect(); }
      } else if (this.state === 'inspect' && e.key === 'Escape') {
        e.preventDefault();
        this.closeInspect();
      }
    });
  }

  softClamp(raw) {
    if (raw < 0) return raw * 0.3;
    if (raw > this.n - 1) return this.n - 1 + (raw - (this.n - 1)) * 0.3;
    return raw;
  }

  handleTap(e) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
    if (!hit) return;
    const i = hit.object.userData.bookIndex;
    if (i === this.selectedIndex && Math.abs(this.pos - i) < 0.35) this.openInspect();
    else this.jumpTo(i);
  }

  step(d) {
    if (this.state !== 'browse') return;
    const base = this.snapTarget ?? Math.round(this.pos);
    this.jumpTo(base + d);
  }

  jumpTo(i) {
    if (this.state !== 'browse') return;
    this.vel = 0;
    this.snapTarget = this.clampIndex(i);
    if (this.reduced) this.pos = this.snapTarget;
  }

  /* ----------------------------------------------------------- tweens */

  tween(dur, onUpdate, onDone) {
    if (this.reduced || dur <= 0) {
      onUpdate(1);
      if (onDone) onDone();
      return;
    }
    this.tweens.push({ t: 0, dur, onUpdate, onDone });
  }

  tickTweens(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = easeInOutCubic(Math.min(1, tw.t / tw.dur));
      tw.onUpdate(k);
      if (tw.t >= tw.dur) {
        this.tweens.splice(i, 1);
        if (tw.onDone) tw.onDone();
      }
    }
  }

  browsePose(pos) {
    const eye = new THREE.Vector3(this.camX(pos), EYE_Y, EYE_Z);
    const m = new THREE.Matrix4().lookAt(eye, new THREE.Vector3(this.camX(pos), LOOK_Y, 0), new THREE.Vector3(0, 1, 0));
    return { eye, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  }

  /* -------------------------------------------------------- transitions */

  openInspect() {
    if (this.state !== 'browse') return;
    const i = this.selectedIndex;
    const book = this.books[i];
    const { H, W } = book.group.userData.size;
    this.setState('to-inspect');
    this.vel = 0;

    const dist = H * 1.9;
    this.anchor.set(this.camX(i), EYE_Y - 0.01, EYE_Z - dist);
    this.panMax = H * 0.5;

    const qTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.06, -Math.PI / 2 + 0.14, 0.02, 'YXZ'));
    const centre = new THREE.Vector3(0, H / 2, -W / 2).applyQuaternion(qTarget);
    const pTarget = this.anchor.clone().sub(centre);

    const p0 = book.group.position.clone();
    const q0 = book.group.quaternion.clone();
    const cam0 = this.camera.position.clone();
    const pose = this.browsePose(i);

    this.tween(0.55, (k) => {
      book.group.position.lerpVectors(p0, pTarget, k);
      book.group.quaternion.slerpQuaternions(q0, qTarget, k);
      this.camera.position.lerpVectors(cam0, pose.eye, k);
      this.camera.quaternion.copy(pose.quat);
    }, () => {
      this.controls.target.copy(this.anchor);
      this.controls.minDistance = H * 0.9;
      this.controls.maxDistance = H * 3.4;
      this.controls.enabled = true;
      this.controls.update();
      this.setState('inspect');
    });
  }

  closeInspect() {
    if (this.state !== 'inspect') return;
    const i = this.selectedIndex;
    const book = this.books[i];
    this.setState('to-browse');
    this.controls.enabled = false;

    const p0 = book.group.position.clone();
    const q0 = book.group.quaternion.clone();
    const qHome = new THREE.Quaternion();
    const pHome = new THREE.Vector3(book.homeX, 0, PULL_Z);
    const cam0 = this.camera.position.clone();
    const camQ0 = this.camera.quaternion.clone();
    const pose = this.browsePose(i);

    this.tween(0.55, (k) => {
      book.group.position.lerpVectors(p0, pHome, k);
      book.group.quaternion.slerpQuaternions(q0, qHome, k);
      this.camera.position.lerpVectors(cam0, pose.eye, k);
      this.camera.quaternion.slerpQuaternions(camQ0, pose.quat, k);
    }, () => {
      this.pos = i;
      this.snapTarget = i;
      this.setState('browse');
    });
  }

  /* ------------------------------------------------------------ update */

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.tickTweens(dt);

    if (this.state === 'browse') {
      if (!this.dragging) {
        if (this.snapTarget !== null) {
          const d = this.snapTarget - this.pos;
          this.pos += this.reduced ? d : d * Math.min(1, dt * SNAP_RATE);
          if (Math.abs(this.snapTarget - this.pos) < 0.0008) this.pos = this.snapTarget;
        } else {
          this.pos += this.vel * dt;
          this.vel *= Math.pow(0.002, dt);
          if (this.pos < 0 || this.pos > this.n - 1) this.vel *= Math.pow(0.00001, dt);
          if (Math.abs(this.vel) < 0.18) {
            this.vel = 0;
            this.snapTarget = this.clampIndex(this.pos);
          }
        }
      }
      this.setSelected(this.clampIndex(this.pos));

      // camera follows with a little lag; pointer adds a whisper of parallax
      const par = this.reduced ? { x: 0, y: 0 } : { x: this.pointer.x * 0.018, y: -this.pointer.y * 0.008 };
      const ease = this.reduced ? 1 : Math.min(1, dt * CAM_RATE);
      this.camera.position.x += (this.camX(this.pos) + par.x - this.camera.position.x) * ease;
      this.camera.position.y += (EYE_Y + par.y - this.camera.position.y) * ease;
      this.camera.position.z += (EYE_Z - this.camera.position.z) * ease;
      this.camera.lookAt(this.camX(this.pos), LOOK_Y, 0);

      // the chosen spine leans out of the row
      for (let i = 0; i < this.n; i++) {
        const g = this.books[i].group;
        const target = i === this.selectedIndex && !this.dragging ? PULL_Z : 0;
        g.position.z += (target - g.position.z) * (this.reduced ? 1 : Math.min(1, dt * PULL_RATE));
      }
    } else if (this.state === 'inspect') {
      this.controls.update();
      const off = this.controls.target.clone().sub(this.anchor);
      if (off.length() > this.panMax) {
        off.setLength(this.panMax);
        this.controls.target.copy(this.anchor).add(off);
      }
    }
  }
}
