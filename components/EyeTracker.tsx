"use client";

import { useEffect } from "react";

const MAX_X = 9;
const MAX_Y = 5;
// Same breakpoint as the mobile nav: small screens look with the device tilt, larger ones with the pointer.
const SMALL_SCREEN = "(max-width: 860px)";
// Degrees of tilt away from the resting angle that push the pupils to the edge of the eye.
const TILT_RANGE = 22;
// After this long without pointer or tilt input, the hero eyes start looking around on their own.
const IDLE_MS = 1500;
// How far the pupils travel toward their target each frame (0..1).
const EASE = 0.14;

type Offset = { x: number; y: number };
/** Where a pupil should look, given the centre of its eye on screen. */
type Target = (cx: number, cy: number) => Offset;
/** What an input source reports back to the animation. */
type InputSink = {
  setTarget: (t: Target) => void;
  /** Real visitor input: resets the idle timer. */
  onInput: () => void;
  /** Wakes the animation without counting as input. */
  kick: () => void;
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** A random spot inside the eye (a quarter of the time dead centre), held for 0.9–3.1 s. */
function randomGlance(now: number) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() < 0.25 ? 0 : 0.5 + Math.random() * 0.5;
  return { x: Math.cos(a) * MAX_X * r, y: Math.sin(a) * MAX_Y * r, until: now + 900 + Math.random() * 2200 };
}

/** Large screens: each eye looks toward the cursor. Returns the cleanup. */
function listenPointer({ setTarget, onInput }: InputSink) {
  let px = -1;
  let py = -1;
  setTarget((cx, cy) => {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = Math.min(1, dist / 260);
    return { x: (dx / dist) * MAX_X * reach, y: (dy / dist) * MAX_Y * reach };
  });
  const onMove = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    onInput();
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => window.removeEventListener("pointermove", onMove);
}

/** Device angles mapped onto the screen's axes, so landscape behaves like portrait. lr = left/right, ud = up/down. */
function screenTilt(beta: number, gamma: number) {
  const angle = screen.orientation?.angle ?? 0;
  if (angle === 90) return { lr: beta, ud: -gamma };
  if (angle === 270 || angle === -90) return { lr: -beta, ud: gamma };
  if (angle === 180) return { lr: -gamma, ud: -beta };
  return { lr: gamma, ud: beta };
}

/** Small screens: all eyes glance the way the phone is tilted, relative to how it's being held. Returns the cleanup. */
function listenTilt({ setTarget, onInput, kick }: InputSink) {
  if (typeof DeviceOrientationEvent === "undefined") return () => {};
  let nx = 0;
  let ny = 0;
  let rest: { ud: number; lr: number } | null = null;
  setTarget(() => ({ x: nx * MAX_X, y: ny * MAX_Y }));

  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const { lr, ud } = screenTilt(e.beta, e.gamma);
    rest ??= { ud, lr };
    // Let the resting angle drift slowly so the eyes re-center as the grip changes.
    rest.ud += (ud - rest.ud) * 0.01;
    rest.lr += (lr - rest.lr) * 0.01;
    nx = clamp((lr - rest.lr) / TILT_RANGE);
    ny = clamp((ud - rest.ud) / TILT_RANGE);
    // Tiny sensor jitter while the phone lies still shouldn't stop the hero eyes wandering.
    if (Math.abs(nx) > 0.08 || Math.abs(ny) > 0.08) onInput();
    else kick();
  };
  const listen = () => window.addEventListener("deviceorientation", onOrient);

  // iOS only exposes motion sensors after the visitor allows it from a tap.
  const requestPermission = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
  const onFirstTap = () => {
    requestPermission!
      .call(DeviceOrientationEvent)
      .then((res) => res === "granted" && listen())
      .catch(() => {}); // declined or unsupported: the eyes simply keep wandering
  };
  if (requestPermission) window.addEventListener("touchend", onFirstTap, { once: true, passive: true });
  else listen();

  return () => {
    window.removeEventListener("deviceorientation", onOrient);
    window.removeEventListener("touchend", onFirstTap);
  };
}

/**
 * The frame loop that eases every on-screen pupil toward its target. Hero eyes wander on their own while the visitor
 * is idle; other eyes only move while there is input. The loop stops itself once everything has settled.
 */
function createPupilAnimator() {
  const eased = new WeakMap<Element, Offset>();
  const glances = new WeakMap<Element, ReturnType<typeof randomGlance>>();
  let target: Target | null = null;
  let raf = 0;
  let lastInput = -Infinity;
  let heroVisible = false;

  const glanceFor = (g: Element, now: number) => {
    let glance = glances.get(g);
    if (!glance || now > glance.until) glances.set(g, (glance = randomGlance(now)));
    return glance;
  };

  const tick = () => {
    raf = 0;
    const now = performance.now();
    const idle = now - lastInput > IDLE_MS;
    let moving = idle && heroVisible;
    document.querySelectorAll<SVGGElement>("[data-pupil]").forEach((g) => {
      const svg = g.ownerSVGElement;
      if (!svg) return;
      const box = svg.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const inHero = !!svg.closest(".hero");
      if (!target && !inHero) return;
      const want = inHero && (idle || !target) ? glanceFor(g, now) : target!(box.left + box.width / 2, box.top + box.height * 0.44);
      const at = eased.get(g) ?? { x: 0, y: 0 };
      at.x += (want.x - at.x) * EASE;
      at.y += (want.y - at.y) * EASE;
      eased.set(g, at);
      if (Math.abs(want.x - at.x) > 0.05 || Math.abs(want.y - at.y) > 0.05) moving = true;
      g.setAttribute("transform", `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})`);
    });
    if (moving) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  return {
    sink: {
      setTarget: (t: Target) => (target = t),
      onInput: () => {
        lastInput = performance.now();
        kick();
      },
      kick,
    } satisfies InputSink,
    clearTarget: () => (target = null),
    setHeroVisible: (visible: boolean) => {
      heroVisible = visible;
      if (visible) kick();
    },
    stop: () => cancelAnimationFrame(raf),
  };
}

// Every eye on the page watches the visitor. Decorative, so it eases toward its target instead of snapping.
export function EyeTracker() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const small = matchMedia(SMALL_SCREEN);
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const pupils = createPupilAnimator();

    // The wander loop only runs while the hero is on screen.
    const hero = document.querySelector(".hero");
    const io = new IntersectionObserver(([entry]) => pupils.setHeroVisible(entry.isIntersecting));
    if (hero) io.observe(hero);

    let stopInput = () => {};
    const startInput = () => {
      stopInput();
      pupils.clearTarget();
      if (small.matches) stopInput = listenTilt(pupils.sink);
      else stopInput = finePointer.matches ? listenPointer(pupils.sink) : () => {};
    };
    startInput();
    small.addEventListener("change", startInput);
    return () => {
      small.removeEventListener("change", startInput);
      io.disconnect();
      stopInput();
      pupils.stop();
    };
  }, []);
  return null;
}
