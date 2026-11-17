// The 3D stage: renders an instrument, handles orbit/zoom, picking, highlighting
// and smooth camera flights to individual anatomy parts.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const HIGHLIGHT = new THREE.Color(0xff9a3c);
const FLIGHT_MS = 950;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Viewer {
  constructor(container, { onHover, onPick } = {}) {
    this.container = container;
    this.onHover = onHover || (() => {});
    this.onPick = onPick || (() => {});

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(this.renderer), 0.04).texture;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.005, 100);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.autoRotateSpeed = 0.8;
    this.controls.addEventListener('start', () => { this.flight = null; });

    this.hemi = new THREE.HemisphereLight(0xfff6e8, 0x40372c, 0.7);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xfff1dd, 2.0);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.01;
    this.scene.add(this.key, this.key.target);
    this.rim = new THREE.DirectionalLight(0xcfe0ff, 0.8);
    this.scene.add(this.rim);

    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickables = [];
    this.parts = new Map();      // partId -> { meshes: [], materials: Set }
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

  /** Swap in a new instrument definition. */
  load(def) {
    if (this.root) {
      this.scene.remove(this.root);
      this.root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
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
        const m = o.material.clone();
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

    // Sit the model on the ground, centred.
    this.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    this.root.updateMatrixWorld(true);
    this.scene.add(this.root);

    this.bounds = new THREE.Box3().setFromObject(model);
    this.sphere = this.bounds.getBoundingSphere(new THREE.Sphere());
    const r = this.sphere.radius;

    this.ground.scale.setScalar(r * 2.2);
    this.controls.minDistance = r * 0.03;
    this.controls.maxDistance = r * 7;
    this.camera.near = Math.max(0.002, r * 0.004);
    this.camera.far = r * 40;
    this.camera.updateProjectionMatrix();

    const c = this.sphere.center;
    this.key.position.set(c.x + r * 1.2, c.y + r * 2.4, c.z + r * 1.6);
    this.key.target.position.copy(c);
    const sc = this.key.shadow.camera;
    sc.left = sc.bottom = -r * 1.4;
    sc.right = sc.top = r * 1.4;
    sc.near = r * 0.5;
    sc.far = r * 6;
    sc.updateProjectionMatrix();
    this.rim.position.set(c.x - r * 2, c.y + r, c.z - r * 2);

    this.#applyMaterials();
    this.overview(false);
    return [...this.parts.keys()];
  }

  /** Fly back to the whole-instrument view. */
  overview(animate = true) {
    const dir = new THREE.Vector3(...(this.def.defaultView || [0.5, 0.3, 1])).normalize();
    const dist = this.#fitDistance(this.sphere.radius) * 1.02;
    this.#flyTo(this.sphere.center.clone(), dir, dist, animate);
  }

  /** Fly the camera to frame one anatomy part. */
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
    const dist = Math.max(this.#fitDistance(sphere.radius) * 1.6, this.sphere.radius * 0.14);
    this.#flyTo(sphere.center, dir, dist, animate);
  }

  setSelected(id) {
    this.selected = id;
    this.#applyMaterials();
  }

  setIsolate(on) {
    this.isolate = on;
    this.#applyMaterials();
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  /** Screen position (px, relative to the canvas) of a part's centre, or null if behind the camera. */
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

  #fitDistance(radius) {
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    return radius / Math.sin(Math.min(vfov, hfov) / 2);
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
      endDir: dir.clone(),
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
    // Logarithmic distance interpolation feels natural when zooming across scales.
    const dist = Math.exp(THREE.MathUtils.lerp(Math.log(f.startDist), Math.log(f.endDist), k));
    this.camera.position.copy(this.controls.target).addScaledVector(dir, dist);
    if (t >= 1) this.flight = null;
  }

  /** A part is faded if isolate mode is on, or if the selected part lists it as an occluder (`ghost`). */
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
          if (isSel || id === this.hovered) m.emissive.copy(HIGHLIGHT);
          else m.emissive.copy(base.emissive);
          m.emissiveIntensity = isSel ? 0.4 : id === this.hovered ? 0.22 : base.emissiveIntensity;
        }
      });
    }
  }

  #tick() {
    this.#stepFlight();
    this.controls.update();
    if (this.selected) {
      const entry = this.parts.get(this.selected);
      const pulse = 0.28 + 0.16 * (0.5 + 0.5 * Math.sin(this.clock.getElapsedTime() * 3.2));
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
    this.camera.updateProjectionMatrix();
  }

  #pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    // Clicks pass through faded parts to whatever solid part lies behind them.
    const solid = hits.find((h) => !this.#isGhost(h.object.userData.partId));
    return (solid || hits[0])?.object.userData.partId ?? null;
  }

  #bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    let hoverQueued = null;

    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved < 6) this.onPick(this.#pick(e.clientX, e.clientY));
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (hoverQueued) return;
      hoverQueued = requestAnimationFrame(() => {
        hoverQueued = null;
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
