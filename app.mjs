import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (from, to, amount) => from + (to - from) * amount;

const nav = document.querySelector(".nav");
const navToggle = document.querySelector("#nav-toggle");
const navMenu = document.querySelector("#nav-menu");
const revealItems = document.querySelectorAll(".reveal");
const canvas = document.querySelector("#scene-canvas");
const tourSection = document.querySelector("#tour");
const chapters = Array.from(document.querySelectorAll(".chapter"));
const dragSurface = document.querySelector("#drag-surface");
const prebookForm = document.querySelector("[data-prebook-form]");
const selectedFinishText = document.querySelector("#selected-finish");
const prebookLink = document.querySelector("#prebook-link");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

if (prebookForm && selectedFinishText && prebookLink) {
  const updatePrebookSelection = () => {
    const chosenFinish = prebookForm.querySelector('input[name="finish"]:checked')?.value;
    if (!chosenFinish) return;

    selectedFinishText.textContent = chosenFinish;
    prebookLink.href = `mailto:orders@aurispro.com?subject=${encodeURIComponent(`Pre-book Auris Pro - ${chosenFinish}`)}`;
  };

  prebookForm.addEventListener("change", updatePrebookSelection);
  updatePrebookSelection();
}

if (navToggle && nav && navMenu) {
  const syncMenuVisibility = (open) => {
    const isMobile = window.innerWidth <= 960;
    navMenu.hidden = isMobile && !open;
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  };

  const setNavState = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-nav-open", open);
    syncMenuVisibility(open);
  };

  syncMenuVisibility(false);

  navToggle.addEventListener("click", () => {
    const nextOpen = navToggle.getAttribute("aria-expanded") !== "true";
    setNavState(nextOpen);
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavState(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      setNavState(false);
      navMenu.hidden = false;
      navToggle.setAttribute("aria-label", "Open navigation menu");
    } else {
      syncMenuVisibility(navToggle.getAttribute("aria-expanded") === "true");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setNavState(false);
    }
  });
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const createRadialTexture = (stops) => {
  const size = 256;
  const element = document.createElement("canvas");
  element.width = size;
  element.height = size;

  const context = element.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createShadowTexture = () =>
  createRadialTexture([
    [0, "rgba(0,0,0,0.56)"],
    [0.35, "rgba(0,0,0,0.42)"],
    [0.7, "rgba(0,0,0,0.12)"],
    [1, "rgba(0,0,0,0)"],
  ]);

const createGlowTexture = (innerColor, outerColor) =>
  createRadialTexture([
    [0, innerColor],
    [0.3, outerColor],
    [1, "rgba(0,0,0,0)"],
  ]);

const poseKeys = [
  "yaw",
  "pitch",
  "roll",
  "modelX",
  "modelY",
  "modelZ",
  "scale",
  "cameraX",
  "cameraY",
  "cameraZ",
  "focusX",
  "focusY",
  "focusZ",
  "band",
  "yoke",
  "shell",
  "cushion",
  "driver",
  "glow",
];

const mixPose = (from, to, progress) =>
  poseKeys.reduce((accumulator, key) => {
    accumulator[key] = lerp(from[key], to[key], progress);
    return accumulator;
  }, {});

const poses = {
  heroStart: {
    yaw: 0.52,
    pitch: -0.18,
    roll: 0.06,
    modelX: 0.18,
    modelY: -0.15,
    modelZ: 0,
    scale: 1.2,
    cameraX: 0.45,
    cameraY: 0.38,
    cameraZ: 8.35,
    focusX: 0,
    focusY: 0.1,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.42,
  },
  heroEnd: {
    yaw: 0.88,
    pitch: -0.12,
    roll: 0.04,
    modelX: 0.14,
    modelY: -0.1,
    modelZ: 0,
    scale: 1.15,
    cameraX: 0.24,
    cameraY: 0.22,
    cameraZ: 7.9,
    focusX: 0,
    focusY: 0.02,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.46,
  },
  orbitStart: {
    yaw: 0.88,
    pitch: -0.12,
    roll: 0.04,
    modelX: 0.12,
    modelY: -0.08,
    modelZ: 0,
    scale: 1.12,
    cameraX: 0.2,
    cameraY: 0.16,
    cameraZ: 7.75,
    focusX: 0,
    focusY: 0,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.5,
  },
  orbitEnd: {
    yaw: 7.18,
    pitch: -0.08,
    roll: 0.02,
    modelX: 0,
    modelY: -0.04,
    modelZ: 0,
    scale: 1.06,
    cameraX: 0,
    cameraY: 0.1,
    cameraZ: 7.45,
    focusX: 0,
    focusY: 0,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.54,
  },
  silenceStart: {
    yaw: 7.18,
    pitch: -0.08,
    roll: 0.02,
    modelX: 0,
    modelY: -0.04,
    modelZ: 0,
    scale: 1.06,
    cameraX: 0,
    cameraY: 0.1,
    cameraZ: 7.45,
    focusX: 0,
    focusY: 0,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.54,
  },
  silenceEnd: {
    yaw: 6.9,
    pitch: -0.04,
    roll: 0.01,
    modelX: 0,
    modelY: -0.06,
    modelZ: 0,
    scale: 1.02,
    cameraX: -0.2,
    cameraY: 0.02,
    cameraZ: 6.95,
    focusX: 0,
    focusY: 0,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.46,
  },
  bandStart: {
    yaw: 6.9,
    pitch: -0.04,
    roll: 0.01,
    modelX: 0,
    modelY: -0.06,
    modelZ: 0,
    scale: 1.02,
    cameraX: -0.2,
    cameraY: 0.02,
    cameraZ: 6.95,
    focusX: 0,
    focusY: 0,
    focusZ: 0,
    band: 0,
    yoke: 0,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.46,
  },
  bandEnd: {
    yaw: 7.08,
    pitch: -0.5,
    roll: 0,
    modelX: 0,
    modelY: -0.04,
    modelZ: 0,
    scale: 1.08,
    cameraX: 0,
    cameraY: 2.2,
    cameraZ: 6.05,
    focusX: 0,
    focusY: 1.85,
    focusZ: 0,
    band: 1,
    yoke: 0.08,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.34,
  },
  yokeStart: {
    yaw: 7.08,
    pitch: -0.5,
    roll: 0,
    modelX: 0,
    modelY: -0.04,
    modelZ: 0,
    scale: 1.08,
    cameraX: 0,
    cameraY: 2.2,
    cameraZ: 6.05,
    focusX: 0,
    focusY: 1.85,
    focusZ: 0,
    band: 1,
    yoke: 0.08,
    shell: 0,
    cushion: 0,
    driver: 0,
    glow: 0.34,
  },
  yokeEnd: {
    yaw: 7.95,
    pitch: -0.18,
    roll: 0.02,
    modelX: 0,
    modelY: -0.08,
    modelZ: 0,
    scale: 1.05,
    cameraX: 1.65,
    cameraY: 0.65,
    cameraZ: 6.55,
    focusX: 1.2,
    focusY: 0.55,
    focusZ: 0,
    band: 0.38,
    yoke: 1,
    shell: 0.12,
    cushion: 0,
    driver: 0,
    glow: 0.36,
  },
  shellStart: {
    yaw: 7.95,
    pitch: -0.18,
    roll: 0.02,
    modelX: 0,
    modelY: -0.08,
    modelZ: 0,
    scale: 1.05,
    cameraX: 1.65,
    cameraY: 0.65,
    cameraZ: 6.55,
    focusX: 1.2,
    focusY: 0.55,
    focusZ: 0,
    band: 0.38,
    yoke: 1,
    shell: 0.12,
    cushion: 0,
    driver: 0,
    glow: 0.36,
  },
  shellEnd: {
    yaw: 6.86,
    pitch: -0.06,
    roll: 0,
    modelX: 0,
    modelY: -0.1,
    modelZ: 0,
    scale: 1,
    cameraX: 0.35,
    cameraY: 0.16,
    cameraZ: 6.1,
    focusX: 0,
    focusY: 0.22,
    focusZ: 0,
    band: 0.18,
    yoke: 0.38,
    shell: 1,
    cushion: 0.2,
    driver: 0,
    glow: 0.42,
  },
  cushionStart: {
    yaw: 6.86,
    pitch: -0.06,
    roll: 0,
    modelX: 0,
    modelY: -0.1,
    modelZ: 0,
    scale: 1,
    cameraX: 0.35,
    cameraY: 0.16,
    cameraZ: 6.1,
    focusX: 0,
    focusY: 0.22,
    focusZ: 0,
    band: 0.18,
    yoke: 0.38,
    shell: 1,
    cushion: 0.2,
    driver: 0,
    glow: 0.42,
  },
  cushionEnd: {
    yaw: 6.72,
    pitch: -0.02,
    roll: 0,
    modelX: 0,
    modelY: -0.1,
    modelZ: 0,
    scale: 0.98,
    cameraX: 0.08,
    cameraY: 0.06,
    cameraZ: 5.55,
    focusX: 0,
    focusY: 0.08,
    focusZ: 0.12,
    band: 0.08,
    yoke: 0.2,
    shell: 0.88,
    cushion: 1,
    driver: 0.18,
    glow: 0.52,
  },
  driverStart: {
    yaw: 6.72,
    pitch: -0.02,
    roll: 0,
    modelX: 0,
    modelY: -0.1,
    modelZ: 0,
    scale: 0.98,
    cameraX: 0.08,
    cameraY: 0.06,
    cameraZ: 5.55,
    focusX: 0,
    focusY: 0.08,
    focusZ: 0.12,
    band: 0.08,
    yoke: 0.2,
    shell: 0.88,
    cushion: 1,
    driver: 0.18,
    glow: 0.52,
  },
  driverEnd: {
    yaw: 6.58,
    pitch: 0,
    roll: 0,
    modelX: 0,
    modelY: -0.1,
    modelZ: 0,
    scale: 0.96,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 5.02,
    focusX: 0,
    focusY: 0,
    focusZ: 0.22,
    band: 0,
    yoke: 0.1,
    shell: 0.62,
    cushion: 0.92,
    driver: 1.18,
    glow: 1,
  },
};

const phaseRanges = [
  { id: "hero", from: poses.heroStart, to: poses.heroEnd },
  { id: "orbit", from: poses.orbitStart, to: poses.orbitEnd },
  { id: "silence", from: poses.silenceStart, to: poses.silenceEnd },
  { id: "band", from: poses.bandStart, to: poses.bandEnd },
  { id: "yoke", from: poses.yokeStart, to: poses.yokeEnd },
  { id: "shell", from: poses.shellStart, to: poses.shellEnd },
  { id: "cushion", from: poses.cushionStart, to: poses.cushionEnd },
  { id: "driver", from: poses.driverStart, to: poses.driverEnd },
];

const currentPose = { ...poses.heroStart };
let activeChapterIndex = 0;
let activePhaseProgress = 0;

const drag = {
  active: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  yawTarget: 0,
  yaw: 0,
  pitchTarget: 0,
  pitch: 0,
};

const syncActiveChapter = () => {
  if (chapters.length === 0) return;

  const viewportLine = window.innerHeight * 0.52;
  let bestIndex = 0;
  let bestDistance = Infinity;

  chapters.forEach((chapter, index) => {
    const rect = chapter.getBoundingClientRect();
    const containsLine = rect.top <= viewportLine && rect.bottom >= viewportLine;
    const distance = containsLine
      ? 0
      : Math.min(Math.abs(rect.top - viewportLine), Math.abs(rect.bottom - viewportLine));

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  activeChapterIndex = bestIndex;
  const activeRect = chapters[bestIndex].getBoundingClientRect();
  activePhaseProgress = clamp((viewportLine - activeRect.top) / Math.max(activeRect.height, 1), 0, 1);

  chapters.forEach((chapter, index) => {
    chapter.classList.toggle("is-active", index === bestIndex);
  });
};

syncActiveChapter();

let chapterSyncPending = false;
const requestChapterSync = () => {
  if (chapterSyncPending) return;

  chapterSyncPending = true;
  window.requestAnimationFrame(() => {
    chapterSyncPending = false;
    syncActiveChapter();
  });
};

let isScrollActive = false;
let lastScrollEventTime = performance.now();
const scrollIdleThreshold = isCoarsePointer ? 170 : 130;

const markScrollActivity = () => {
  lastScrollEventTime = performance.now();
  if (!isScrollActive) {
    isScrollActive = true;
    setRenderQuality("low");
  }
};

window.addEventListener(
  "scroll",
  () => {
    markScrollActivity();
    requestChapterSync();
  },
  { passive: true }
);
window.addEventListener("resize", syncActiveChapter);

if (dragSurface && !reduceMotion) {
  dragSurface.addEventListener("pointerdown", (event) => {
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    dragSurface.classList.add("is-dragging");
    dragSurface.setPointerCapture(event.pointerId);
  });

  dragSurface.addEventListener("pointermove", (event) => {
    if (!drag.active) return;

    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;

    drag.yawTarget = clamp(drag.yawTarget + dx * 0.012, -1.4, 1.4);
    drag.pitchTarget = clamp(drag.pitchTarget + dy * 0.004, -0.35, 0.22);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  });

  const releaseDrag = () => {
    drag.active = false;
    dragSurface.classList.remove("is-dragging");
    if (drag.pointerId !== null && dragSurface.hasPointerCapture(drag.pointerId)) {
      dragSurface.releasePointerCapture(drag.pointerId);
    }
    drag.pointerId = null;
  };

  dragSurface.addEventListener("pointerup", releaseDrag);
  dragSurface.addEventListener("pointercancel", releaseDrag);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
camera.position.set(0.4, 0.4, 8.4);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isCoarsePointer,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const getMaxPixelRatio = () => Math.min(window.devicePixelRatio, window.innerWidth <= 960 || isCoarsePointer ? 1.15 : 1.5);
let maxPixelRatio = getMaxPixelRatio();
let scrollingPixelRatio = Math.min(maxPixelRatio, isCoarsePointer ? 0.9 : 1);
let renderQualityMode = "high";

const setRenderQuality = (mode) => {
  if (mode === renderQualityMode) return;

  renderQualityMode = mode;
  renderer.setPixelRatio(mode === "low" ? scrollingPixelRatio : maxPixelRatio);
};

const syncPixelRatioCaps = () => {
  maxPixelRatio = getMaxPixelRatio();
  scrollingPixelRatio = Math.min(maxPixelRatio, isCoarsePointer ? 0.9 : 1);
  renderer.setPixelRatio(renderQualityMode === "low" ? scrollingPixelRatio : maxPixelRatio);
};

renderer.setPixelRatio(maxPixelRatio);

let sceneIsVisible = true;
if (tourSection && "IntersectionObserver" in window) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      sceneIsVisible = entries.some((entry) => entry.isIntersecting);
    },
    {
      threshold: 0.01,
    }
  );

  sceneObserver.observe(tourSection);
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xf8f1e8, 0x07090b, 1.4));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(5.5, 7.5, 8.5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x8de1dc, 1.1);
rimLight.position.set(-6, 3.5, -4.5);
scene.add(rimLight);

const warmLight = new THREE.PointLight(0xcfaa78, 16, 20, 2);
warmLight.position.set(4.8, 1.8, 4.2);
scene.add(warmLight);

const coolLight = new THREE.PointLight(0x74d2ff, 12, 18, 2);
coolLight.position.set(-4.8, 1.2, 3.6);
scene.add(coolLight);

const sceneRig = new THREE.Group();
scene.add(sceneRig);

const floorShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(11, 11),
  new THREE.MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  })
);
floorShadow.rotation.x = -Math.PI / 2;
floorShadow.position.y = -3.18;
floorShadow.scale.set(2.1, 0.72, 1);
sceneRig.add(floorShadow);

const haloCool = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createGlowTexture("rgba(141,225,220,0.8)", "rgba(141,225,220,0.16)"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.28,
  })
);
haloCool.scale.set(4.4, 4.4, 1);
haloCool.position.set(-2.65, 0.1, -1.3);
sceneRig.add(haloCool);

const haloWarm = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createGlowTexture("rgba(207,169,120,0.82)", "rgba(207,169,120,0.16)"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.24,
  })
);
haloWarm.scale.set(4.9, 4.9, 1);
haloWarm.position.set(2.75, -0.1, -1.5);
sceneRig.add(haloWarm);

const materials = {
  shell: new THREE.MeshPhysicalMaterial({
    color: 0x171b21,
    metalness: 0.82,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.25,
  }),
  shellSecondary: new THREE.MeshPhysicalMaterial({
    color: 0x262c35,
    metalness: 0.68,
    roughness: 0.28,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.2,
  }),
  accent: new THREE.MeshPhysicalMaterial({
    color: 0xcda36f,
    metalness: 0.92,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.45,
  }),
  highlight: new THREE.MeshPhysicalMaterial({
    color: 0xa8fbf2,
    metalness: 0.75,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  }),
  band: new THREE.MeshPhysicalMaterial({
    color: 0x11151a,
    metalness: 0.72,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.4,
  }),
  canopy: new THREE.MeshPhysicalMaterial({
    color: 0x232830,
    metalness: 0.04,
    roughness: 0.9,
    sheen: 1,
    sheenColor: new THREE.Color(0x747a84),
    sheenRoughness: 0.62,
    envMapIntensity: 0.55,
  }),
  cushion: new THREE.MeshPhysicalMaterial({
    color: 0x15181d,
    metalness: 0.02,
    roughness: 0.95,
    sheen: 1,
    sheenColor: new THREE.Color(0x3d434b),
    sheenRoughness: 0.7,
    envMapIntensity: 0.5,
  }),
  cushionInner: new THREE.MeshStandardMaterial({
    color: 0x0d1014,
    roughness: 0.98,
    metalness: 0.02,
  }),
  driverFrame: new THREE.MeshPhysicalMaterial({
    color: 0x222933,
    metalness: 0.88,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.4,
  }),
  driverCore: new THREE.MeshPhysicalMaterial({
    color: 0x13222b,
    metalness: 0.9,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: new THREE.Color(0x59d6e5),
    emissiveIntensity: 0.35,
    envMapIntensity: 1.45,
  }),
  grille: new THREE.MeshBasicMaterial({
    color: 0x86d6d0,
    transparent: true,
    opacity: 0.78,
  }),
  shadowDisk: new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
  }),
};

const createGrille = (material) => {
  const group = new THREE.Group();
  const dotGeometry = new THREE.SphereGeometry(0.028, 8, 8);
  const rings = [
    { radius: 0.14, count: 6 },
    { radius: 0.26, count: 10 },
    { radius: 0.38, count: 14 },
  ];

  rings.forEach(({ radius, count }) => {
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const dot = new THREE.Mesh(dotGeometry, material);
      dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.18, 0.02);
      group.add(dot);
    }
  });

  return group;
};

const createCupAssembly = (side) => {
  const cup = new THREE.Group();
  cup.position.set(side * 2.72, -0.34, 0.08);
  cup.rotation.y = side * 0.08;

  const shellGroup = new THREE.Group();
  cup.add(shellGroup);

  const shell = new THREE.Mesh(new RoundedBoxGeometry(1.68, 2.2, 1.06, 10, 0.32), materials.shell);
  shellGroup.add(shell);

  const shellInset = new THREE.Mesh(
    new RoundedBoxGeometry(1.48, 2.02, 0.86, 8, 0.28),
    materials.shellSecondary
  );
  shellInset.position.z = -0.06;
  shellInset.scale.set(0.96, 0.96, 0.92);
  shellGroup.add(shellInset);

  const outerAura = new THREE.Mesh(new RoundedBoxGeometry(1.82, 2.34, 0.12, 6, 0.26), materials.shadowDisk);
  outerAura.position.z = -0.56;
  outerAura.scale.set(1, 1, 0.8);
  shellGroup.add(outerAura);

  const accentRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.038, 24, 80), materials.accent);
  accentRing.rotation.x = Math.PI / 2;
  accentRing.scale.y = 1.16;
  accentRing.position.z = 0.42;
  shellGroup.add(accentRing);

  const coolRing = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.024, 18, 72), materials.highlight);
  coolRing.rotation.x = Math.PI / 2;
  coolRing.scale.y = 1.14;
  coolRing.position.z = 0.24;
  shellGroup.add(coolRing);

  const cushion = new THREE.Group();
  cushion.position.z = 0.3;
  cup.add(cushion);

  const cushionBody = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.16, 24, 72), materials.cushion);
  cushionBody.rotation.x = Math.PI / 2;
  cushionBody.scale.y = 1.18;
  cushion.add(cushionBody);

  const cushionInner = new THREE.Mesh(
    new RoundedBoxGeometry(1.08, 1.46, 0.2, 6, 0.2),
    materials.cushionInner
  );
  cushionInner.position.z = 0.08;
  cushionInner.scale.z = 0.5;
  cushion.add(cushionInner);

  const driver = new THREE.Group();
  driver.position.z = 0.16;
  cup.add(driver);

  const driverPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.1, 48), materials.driverFrame);
  driverPlate.rotation.x = Math.PI / 2;
  driverPlate.scale.y = 1.2;
  driver.add(driverPlate);

  const driverCore = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 48), materials.driverCore);
  driverCore.rotation.x = Math.PI / 2;
  driverCore.scale.y = 1.24;
  driver.add(driverCore);

  const grille = createGrille(materials.grille);
  grille.position.z = 0.08;
  driver.add(grille);

  const pivotOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.18, 24), materials.accent);
  pivotOuter.rotation.z = Math.PI / 2;
  pivotOuter.position.set(side * 0.86, 0.34, 0);
  cup.add(pivotOuter);

  if (side > 0) {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 24), materials.accent);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(0.94, 0.58, 0.08);
    cup.add(crown);

    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 18), materials.highlight);
    button.rotation.z = Math.PI / 2;
    button.position.set(0.94, 0.22, 0.12);
    cup.add(button);
  }

  return {
    cup,
    shellGroup,
    cushion,
    driver,
    driverCore,
  };
};

const createYokeAssembly = (side) => {
  const yoke = new THREE.Group();
  yoke.position.set(side * 2.34, 0.94, 0.14);
  yoke.rotation.z = side * 0.18;

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 1.36, 20), materials.accent);
  rail.position.y = -0.36;
  yoke.add(rail);

  const railInset = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 1.1, 18), materials.highlight);
  railInset.position.y = -0.24;
  yoke.add(railInset);

  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.68, 18), materials.band);
  bridge.rotation.x = Math.PI / 2;
  bridge.position.set(side * 0.12, -0.92, 0.14);
  yoke.add(bridge);

  return yoke;
};

const createHeadband = () => {
  const bandGroup = new THREE.Group();

  const outerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.38, 1.38, 0.48),
    new THREE.Vector3(-1.64, 2.82, 0.44),
    new THREE.Vector3(0, 3.52, 0),
    new THREE.Vector3(1.64, 2.82, 0.44),
    new THREE.Vector3(2.38, 1.38, 0.48),
  ]);

  const accentCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.18, 1.48, 0.34),
    new THREE.Vector3(-1.5, 2.64, 0.26),
    new THREE.Vector3(0, 3.2, 0),
    new THREE.Vector3(1.5, 2.64, 0.26),
    new THREE.Vector3(2.18, 1.48, 0.34),
  ]);

  const canopyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.32, 2.1, 0.12),
    new THREE.Vector3(-0.64, 2.78, 0.08),
    new THREE.Vector3(0, 3.04, 0),
    new THREE.Vector3(0.64, 2.78, 0.08),
    new THREE.Vector3(1.32, 2.1, 0.12),
  ]);

  const outerBand = new THREE.Mesh(new THREE.TubeGeometry(outerCurve, 160, 0.13, 24, false), materials.band);
  bandGroup.add(outerBand);

  const accentBand = new THREE.Mesh(new THREE.TubeGeometry(accentCurve, 140, 0.04, 18, false), materials.highlight);
  bandGroup.add(accentBand);

  const canopy = new THREE.Mesh(new THREE.TubeGeometry(canopyCurve, 140, 0.25, 20, false), materials.canopy);
  canopy.scale.z = 0.72;
  canopy.position.y = -0.02;
  bandGroup.add(canopy);

  const meshArc = new THREE.Mesh(new THREE.TubeGeometry(canopyCurve, 140, 0.13, 16, false), materials.accent);
  meshArc.scale.z = 0.46;
  meshArc.position.y = 0.02;
  bandGroup.add(meshArc);

  return {
    bandGroup,
    outerBand,
    canopy,
    meshArc,
  };
};

const createHeadphoneModel = () => {
  const root = new THREE.Group();
  sceneRig.add(root);

  const band = createHeadband();
  root.add(band.bandGroup);

  const leftYoke = createYokeAssembly(-1);
  const rightYoke = createYokeAssembly(1);
  root.add(leftYoke, rightYoke);

  const leftCup = createCupAssembly(-1);
  const rightCup = createCupAssembly(1);
  root.add(leftCup.cup, rightCup.cup);

  return {
    root,
    band,
    leftYoke,
    rightYoke,
    leftCup,
    rightCup,
  };
};

const model = createHeadphoneModel();

const targetLookAt = new THREE.Vector3();

const resizeRenderer = () => {
  const { clientWidth, clientHeight } = canvas;
  if (clientWidth === 0 || clientHeight === 0) return;

  syncPixelRatioCaps();
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
};

resizeRenderer();
window.addEventListener("resize", resizeRenderer);

const applyPoseToModel = (pose, elapsed) => {
  const drift = reduceMotion ? 0 : Math.sin(elapsed * 0.72) * 0.05;
  const driftTilt = reduceMotion ? 0 : Math.sin(elapsed * 0.52) * 0.012;

  model.root.position.set(pose.modelX, pose.modelY + drift, pose.modelZ);
  model.root.rotation.set(pose.pitch + driftTilt + drag.pitch, pose.yaw + drag.yaw, pose.roll);
  model.root.scale.setScalar(pose.scale);

  model.band.bandGroup.position.y = pose.band * 0.58;
  model.band.bandGroup.rotation.z = pose.band * 0.04;
  model.band.canopy.position.y = -0.02 + pose.band * 0.34;
  model.band.canopy.position.z = pose.band * -0.08;
  model.band.meshArc.position.y = 0.02 + pose.band * 0.24;

  model.leftYoke.position.set(-2.34 - pose.yoke * 0.34, 0.94 - pose.yoke * 0.18, 0.14 + pose.yoke * 0.22);
  model.rightYoke.position.set(2.34 + pose.yoke * 0.34, 0.94 - pose.yoke * 0.18, 0.14 + pose.yoke * 0.22);
  model.leftYoke.rotation.z = -0.18 - pose.yoke * 0.1;
  model.rightYoke.rotation.z = 0.18 + pose.yoke * 0.1;

  model.leftCup.cup.position.set(-2.72 - pose.shell * 0.56, -0.34 + pose.shell * 0.04, 0.08 - pose.shell * 0.2);
  model.rightCup.cup.position.set(2.72 + pose.shell * 0.56, -0.34 + pose.shell * 0.04, 0.08 - pose.shell * 0.2);
  model.leftCup.cup.rotation.y = -0.08 - pose.shell * 0.1;
  model.rightCup.cup.rotation.y = 0.08 + pose.shell * 0.1;

  model.leftCup.cushion.position.z = 0.3 + pose.cushion * 0.62;
  model.rightCup.cushion.position.z = 0.3 + pose.cushion * 0.62;

  model.leftCup.driver.position.z = 0.16 + pose.driver * 1.12;
  model.rightCup.driver.position.z = 0.16 + pose.driver * 1.12;
  model.leftCup.driver.rotation.y = -pose.driver * 0.36;
  model.rightCup.driver.rotation.y = pose.driver * 0.36;

  model.leftCup.driverCore.material.emissiveIntensity = 0.32 + pose.driver * 0.92;
  model.rightCup.driverCore.material.emissiveIntensity = 0.32 + pose.driver * 0.92;

  haloCool.material.opacity = 0.12 + pose.glow * 0.18;
  haloWarm.material.opacity = 0.1 + pose.glow * 0.16;

  floorShadow.position.y = -3.18 + pose.driver * 0.12;
  floorShadow.material.opacity = 0.72 - pose.driver * 0.16;
  floorShadow.scale.x = 2.1 - pose.driver * 0.12;
  floorShadow.scale.y = 0.72 - pose.driver * 0.08;

  camera.position.set(pose.cameraX, pose.cameraY, pose.cameraZ);
  targetLookAt.set(pose.focusX, pose.focusY, pose.focusZ);
  camera.lookAt(targetLookAt);
};

let lastTime = 0;
let lastRenderFrame = 0;
const maxFps = isCoarsePointer ? 50 : 60;
const minFrameInterval = 1000 / maxFps;

const animate = (time) => {
  if (!sceneIsVisible && !drag.active) return;
  if (time - lastRenderFrame < minFrameInterval) return;
  lastRenderFrame = time;

  const seconds = time * 0.001;

  if (isScrollActive && performance.now() - lastScrollEventTime > scrollIdleThreshold) {
    isScrollActive = false;
    setRenderQuality("high");
  }

  const activeRange = phaseRanges[activeChapterIndex] || phaseRanges[0];
  const targetPose = mixPose(activeRange.from, activeRange.to, activePhaseProgress);

  if (activeRange.id === "hero" && !reduceMotion) {
    drag.yaw = lerp(drag.yaw, drag.yawTarget, drag.active ? 0.16 : 0.08);
    drag.pitch = lerp(drag.pitch, drag.pitchTarget, drag.active ? 0.16 : 0.08);
  } else {
    drag.yawTarget = lerp(drag.yawTarget, 0, 0.08);
    drag.pitchTarget = lerp(drag.pitchTarget, 0, 0.08);
    drag.yaw = lerp(drag.yaw, 0, 0.08);
    drag.pitch = lerp(drag.pitch, 0, 0.08);
  }

  poseKeys.forEach((key) => {
    currentPose[key] = lerp(currentPose[key], targetPose[key], reduceMotion ? 0.2 : 0.08);
  });

  applyPoseToModel(currentPose, seconds);
  renderer.render(scene, camera);
  lastTime = seconds;
};

renderer.setAnimationLoop(animate);

