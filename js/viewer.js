// The 3D stage: physically based lighting, orbit/zoom, picking, highlighting,
// camera flights to anatomy parts, and an offscreen thumbnail renderer.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { applyTriplanar } from './lib/materials.js';

const FLIGHT_MS = 1150;
const HDRI_BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/equirectangular/';
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function makeRenderer(opts = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, ...opts });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

/** Soft radial "contact shadow" texture laid flat under the model. */
let blobTexture;
function getBlobTexture() {
  if (blobTexture) return blobTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.22)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  blobTexture = new THREE.CanvasTexture(c);
  return blobTexture;
}

/** Lights, environment and ground shared by the main viewer and the thumbnailer. */
class Studio {
  constructor(renderer, env = 'room') {
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    this.scene.environmentIntensity = 0.85;
    if (env !== 'room') {
      new RGBELoader().load(`${HDRI_BASE}${env}.hdr`, (tex) => {
        this.scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
      });
    }
    this.hemi = new THREE.HemisphereLight(0xfff4e6, 0x2b2620, 0.35);
    this.key = new THREE.DirectionalLight(0xfff0dc, 2.4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0003;
    this.key.shadow.normalBias = 0.012;
    this.fill = new THREE.DirectionalLight(0xdfe8ff, 0.6);
    this.rim = new THREE.DirectionalLight(0xffffff, 1.1);
    this.scene.add(this.hemi, this.key, this.key.target, this.fill, this.rim);

    this.ground = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.ShadowMaterial({ opacity: 0.32 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: getBlobTexture(), transparent: true, depthWrite: false })
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.position.y = 0.0008;
    this.blob.renderOrder = -1;
    this.scene.add(this.ground, this.blob);
  }

  /** Sit the model on the floor, centred, and fit lights/shadows to it. Returns bounds info. */
  frame(model) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.x -= c.x;
    model.position.z -= c.z;
    model.position.y -= box.min.y;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const size = bounds.getSize(new THREE.Vector3());
    const r = sphere.radius;
    const sc = sphere.center;

    this.ground.scale.setScalar(r * 2.5);
    this.blob.scale.set(Math.max(size.x, r * 0.3) * 1.5, Math.max(size.z, r * 0.3) * 1.5, 1);
    this.key.position.set(sc.x + r * 1.3, sc.y + r * 2.6, sc.z + r * 1.8);
    this.key.target.position.copy(sc);
    const cam = this.key.shadow.camera;
    cam.left = cam.bottom = -r * 1.3;
    cam.right = cam.top = r * 1.3;
    cam.near = r * 0.4;
    cam.far = r * 6;
    cam.updateProjectionMatrix();
    this.key.shadow.radius = 4;
    this.fill.position.set(sc.x - r * 2, sc.y + r * 0.8, sc.z + r * 1.4);
    this.rim.position.set(sc.x - r * 0.6, sc.y + r * 1.6, sc.z - r * 2.4);
    return { bounds, sphere };
  }
}

function disposeTree(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
}

function fitDistance(camera, radius, visW = 1, visH = 1) {
  // visW/visH: fraction of the canvas actually visible (not covered by panels)
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const tanV = Math.tan(vfov / 2) * visH;
  const tanH = Math.tan(vfov / 2) * camera.aspect * visW;
  const half = Math.atan(Math.min(tanV, tanH));
  return radius / Math.sin(half);
}

// ============================================================================
export class Viewer {
  constructor(container, { onHover, onPick, env = 'room' } = {}) {
    this.container = container;
    this.onHover = onHover || (() => {});
    this.onPick = onPick || (() => {});

    this.renderer = makeRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    this.studio = new Studio(this.renderer, env);
    this.scene = this.studio.scene;

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.005, 100);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.autoRotateSpeed = 0.7;
    this.controls.addEventListener('start', () => { this.flight = null; });

    this.highlight = new THREE.Color(0xff9a3c);
    this.insets = { left: 0, right: 0, top: 0, bottom: 0 };
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickables = [];
    this.parts = new Map();
    this.selected = null;
    this.hovered = null;
    this.isolate = false;
    this.flight = null;
    this.clock = new THREE.Clock();

    this.#bindPointer();
    new ResizeObserver(() => this.#resize()).observe(container);
    this.#resize();
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  /** A 2D canvas holding a copy of the current frame, used for slide/fade transitions. */
  snapshot() {
    const src = this.renderer.domElement;
    this.renderer.render(this.scene, this.camera);
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  setAccent(color) {
    this.highlight.set(color);
    this.#applyMaterials();
  }

  /** Pixels of the canvas covered by floating panels; the model is framed in the remaining area. */
  setInsets(insets) {
    this.insets = { ...this.insets, ...insets };
    this.#resize();
  }

  load(def) {
    if (this.root) {
      this.scene.remove(this.root);
      disposeTree(this.root);
    }
    this.def = def;
    this.selected = null;
    this.hovered = null;
    this.parts.clear();
    this.pickables = [];

    const model = def.build();
    this.root = new THREE.Group();
    this.root.add(model);

    // Give every (material, part) pair its own material so highlighting one part never bleeds into another.
    const cache = new Map();
    model.traverse((o) => {
      if (!o.isMesh) return;
      const id = o.userData.partId;
      if (!id) return;
      const key = `${o.material.uuid}|${id}`;
      if (!cache.has(key)) {
        const m = applyTriplanar(o.material.clone());
        m.userData.base = {
          emissive: m.emissive ? m.emissive.clone() : null,
          emissiveIntensity: m.emissiveIntensity ?? 1,
          transparent: m.transparent,
          opacity: m.opacity,
          depthWrite: m.depthWrite,
        };
        cache.set(key, m);
      }
      o.material = cache.get(key);
      if (!this.parts.has(id)) this.parts.set(id, { meshes: [], materials: new Set() });
      const entry = this.parts.get(id);
      entry.meshes.push(o);
      entry.materials.add(o.material);
      this.pickables.push(o);
    });

    const { bounds, sphere } = this.studio.frame(this.root);
    this.scene.add(this.root);
    this.bounds = bounds;
    this.sphere = sphere;
    const r = sphere.radius;
    this.controls.minDistance = r * 0.03;
    this.controls.maxDistance = r * 7;
    this.camera.near = Math.max(0.002, r * 0.004);
    this.camera.far = r * 40;
    this.camera.updateProjectionMatrix();

    this.#applyMaterials();
    // Start a little further out and glide in.
    this.overview(false, 1.35);
    this.overview(true);
    return [...this.parts.keys()];
  }

  overview(animate = true, zoom = 1) {
    const dir = new THREE.Vector3(...(this.def.defaultView || [0.5, 0.3, 1])).normalize();
    const dist = this.#fit(this.sphere.radius) * 1.0 * zoom;
    this.#flyTo(this.sphere.center.clone(), dir, dist, animate);
  }

  focusPart(id, animate = true) {
    const entry = this.parts.get(id);
    if (!entry) return;
    const box = new THREE.Box3();
    entry.meshes.forEach((m) => box.expandByObject(m));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const meta = this.def.parts.find((p) => p.id === id);
    const dir = meta?.view
      ? new THREE.Vector3(...meta.view).normalize()
      : this.camera.position.clone().sub(this.controls.target).normalize();
    const dist = Math.max(this.#fit(sphere.radius) * 1.55, this.sphere.radius * 0.14);
    this.#flyTo(sphere.center, dir, dist, animate);
  }

  setSelected(id) { this.selected = id; this.#applyMaterials(); }
  setIsolate(on) { this.isolate = on; this.#applyMaterials(); }
  setAutoRotate(on) { this.controls.autoRotate = on; }

  projectPart(id) {
    const entry = this.parts.get(id);
    if (!entry) return null;
    if (!entry.center) {
      const box = new THREE.Box3();
      entry.meshes.forEach((m) => box.expandByObject(m));
      entry.center = box.getCenter(new THREE.Vector3());
    }
    const p = entry.center.clone().project(this.camera);
    if (p.z > 1) return null;
    const { clientWidth: w, clientHeight: h } = this.renderer.domElement;
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
  }

  // ---------------------------------------------------------------------------
  #fit(radius) {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const { left, right, top, bottom } = this.insets;
    return fitDistance(this.camera, radius, Math.max(0.25, (w - left - right) / w), Math.max(0.25, (h - top - bottom) / h));
  }

  #flyTo(target, dir, dist, animate) {
    const endPos = target.clone().addScaledVector(dir, dist);
    if (!animate) {
      this.flight = null;
      this.controls.target.copy(target);
      this.camera.position.copy(endPos);
      this.controls.update();
      return;
    }
    const startTarget = this.controls.target.clone();
    const offset = this.camera.position.clone().sub(startTarget);
    this.flight = {
      t0: performance.now(),
      startTarget,
      endTarget: target.clone(),
      startDir: offset.clone().normalize(),
      startDist: offset.length(),
      endDist: dist,
      rot: new THREE.Quaternion().setFromUnitVectors(offset.clone().normalize(), dir.clone()),
    };
  }

  #stepFlight() {
    const f = this.flight;
    if (!f) return;
    const t = Math.min(1, (performance.now() - f.t0) / FLIGHT_MS);
    const k = easeInOut(t);
    this.controls.target.lerpVectors(f.startTarget, f.endTarget, k);
    const q = new THREE.Quaternion().slerp(f.rot, k);
    const dir = f.startDir.clone().applyQuaternion(q);
    const dist = Math.exp(THREE.MathUtils.lerp(Math.log(f.startDist), Math.log(f.endDist), k));
    this.camera.position.copy(this.controls.target).addScaledVector(dir, dist);
    if (t >= 1) this.flight = null;
  }

  #isGhost(id) {
    if (!this.selected || id === this.selected) return false;
    if (this.isolate) return true;
    const meta = this.def.parts.find((p) => p.id === this.selected);
    return !!meta?.ghost?.includes(id);
  }

  #applyMaterials() {
    for (const [id, entry] of this.parts) {
      const isSel = id === this.selected;
      const ghost = this.#isGhost(id);
      entry.materials.forEach((m) => {
        const base = m.userData.base;
        const wantTransparent = ghost || base.transparent;
        if (m.transparent !== wantTransparent) m.needsUpdate = true;
        m.transparent = wantTransparent;
        m.opacity = ghost ? Math.min(base.opacity, 0.1) : base.opacity;
        m.depthWrite = ghost ? false : base.depthWrite;
        if (m.emissive) {
          if (isSel || id === this.hovered) m.emissive.copy(this.highlight);
          else m.emissive.copy(base.emissive);
          m.emissiveIntensity = isSel ? 0.4 : id === this.hovered ? 0.2 : base.emissiveIntensity;
        }
      });
    }
  }

  #tick() {
    this.#stepFlight();
    this.controls.update();
    if (this.selected) {
      const entry = this.parts.get(this.selected);
      const pulse = 0.22 + 0.16 * (0.5 + 0.5 * Math.sin(this.clock.getElapsedTime() * 3.2));
      entry?.materials.forEach((m) => { if (m.emissive) m.emissiveIntensity = pulse; });
    }
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
  }

  #resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const { left, right, top, bottom } = this.insets;
    this.camera.setViewOffset(w, h, (right - left) / 2, (bottom - top) / 2, w, h);
    this.camera.updateProjectionMatrix();
  }

  #pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    const solid = hits.find((h) => !this.#isGhost(h.object.userData.partId));
    return (solid || hits[0])?.object.userData.partId ?? null;
  }

  #bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    let queued = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 6) this.onPick(this.#pick(e.clientX, e.clientY));
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || queued) return;
      queued = requestAnimationFrame(() => {
        queued = null;
        const id = e.buttons ? null : this.#pick(e.clientX, e.clientY);
        if (id !== this.hovered) {
          this.hovered = id;
          this.#applyMaterials();
        }
        el.style.cursor = id ? 'pointer' : 'grab';
        this.onHover(id, e.clientX, e.clientY);
      });
    });
    el.addEventListener('pointerleave', () => {
      this.hovered = null;
      this.#applyMaterials();
      this.onHover(null);
    });
  }
}

// ============================================================================
/** Renders small product-shot thumbnails of instruments, one at a time, off screen. */
export class Thumbnailer {
  constructor(size = 200) {
    this.size = size;
    this.renderer = makeRenderer({ preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(size, size, false);
    this.studio = new Studio(this.renderer);
    this.studio.ground.material.opacity = 0.25;
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.005, 100);
  }

  render(def) {
    const model = def.build();
    const root = new THREE.Group();
    root.add(model);
    const { sphere } = this.studio.frame(root);
    this.studio.scene.add(root);
    const dir = new THREE.Vector3(...(def.defaultView || [0.5, 0.3, 1])).normalize();
    const dist = fitDistance(this.camera, sphere.radius) * 0.92;
    this.camera.near = sphere.radius * 0.01;
    this.camera.far = sphere.radius * 20;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(sphere.center).addScaledVector(dir, dist);
    this.camera.lookAt(sphere.center);
    this.renderer.render(this.studio.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/webp', 0.9);
    this.studio.scene.remove(root);
    disposeTree(root);
    return url;
  }
}
