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

type Target = (cx: number, cy: number) => { x: number; y: number };

// Every eye on the page watches the visitor. Decorative, so it eases toward its target instead of snapping.
export function EyeTracker() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const small = matchMedia(SMALL_SCREEN);
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const state = new WeakMap<Element, { x: number; y: number }>();
    let target: Target | null = null;
    let raf = 0;
    let lastInput = -Infinity;
    let heroVisible = false;
    // Each hero eye wanders to its own random spot, holds it for a moment, then picks another.
    const wander = new WeakMap<Element, { x: number; y: number; until: number }>();
    const wanderTarget = (g: Element, now: number) => {
      let w = wander.get(g);
      if (!w || now > w.until) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() < 0.25 ? 0 : 0.5 + Math.random() * 0.5;
        w = { x: Math.cos(a) * MAX_X * r, y: Math.sin(a) * MAX_Y * r, until: now + 900 + Math.random() * 2200 };
        wander.set(g, w);
      }
      return w;
    };

    const tick = () => {
      raf = 0;
      const now = performance.now();
      const idle = now - lastInput > IDLE_MS;
      let moving = idle && heroVisible;
      document.querySelectorAll<SVGGElement>("[data-pupil]").forEach((g) => {
        const svg = g.ownerSVGElement;
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const inHero = !!svg.closest(".hero");
        if (!target && !inHero) return;
        const t =
          inHero && (idle || !target)
            ? wanderTarget(g, now)
            : target!(r.left + r.width / 2, r.top + r.height * 0.44);
        const s = state.get(g) ?? { x: 0, y: 0 };
        s.x += (t.x - s.x) * 0.14;
        s.y += (t.y - s.y) * 0.14;
        state.set(g, s);
        if (Math.abs(t.x - s.x) > 0.05 || Math.abs(t.y - s.y) > 0.05) moving = true;
        g.setAttribute("transform", `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onInput = () => {
      lastInput = performance.now();
      kick();
    };

    // The wander loop only runs while the hero is on screen.
    const hero = document.querySelector(".hero");
    const io = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) kick();
    });
    if (hero) io.observe(hero);

    // Large screens: each eye looks toward the cursor.
    const startPointer = () => {
      if (!finePointer.matches) return () => {};
      let px = -1;
      let py = -1;
      target = (cx, cy) => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        return { x: (dx / dist) * MAX_X * reach, y: (dy / dist) * MAX_Y * reach };
      };
      const onMove = (e: PointerEvent) => {
        px = e.clientX;
        py = e.clientY;
        onInput();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    };

    // Small screens: all eyes glance the way the phone is tilted, relative to how it's being held.
    const startTilt = () => {
      if (typeof DeviceOrientationEvent === "undefined") return () => {};
      let nx = 0;
      let ny = 0;
      let rest: { beta: number; gamma: number } | null = null;
      target = () => ({ x: nx * MAX_X, y: ny * MAX_Y });

      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.beta == null || e.gamma == null) return;
        // Map the raw angles onto the screen's axes so landscape behaves like portrait.
        const angle = screen.orientation?.angle ?? 0;
        let lr = e.gamma;
        let ud = e.beta;
        if (angle === 90) [lr, ud] = [e.beta, -e.gamma];
        else if (angle === 270 || angle === -90) [lr, ud] = [-e.beta, e.gamma];
        else if (angle === 180) [lr, ud] = [-e.gamma, -e.beta];
        if (!rest) rest = { beta: ud, gamma: lr };
        // Let the resting angle drift slowly so the eyes re-center as the grip changes.
        rest.beta += (ud - rest.beta) * 0.01;
        rest.gamma += (lr - rest.gamma) * 0.01;
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        nx = clamp((lr - rest.gamma) / TILT_RANGE);
        ny = clamp((ud - rest.beta) / TILT_RANGE);
        // Tiny sensor jitter while the phone lies still shouldn't stop the hero eyes wandering.
        if (Math.abs(nx) > 0.08 || Math.abs(ny) > 0.08) onInput();
        else kick();
      };
      const listen = () => window.addEventListener("deviceorientation", onOrient);

      // iOS only exposes motion sensors after the visitor allows it from a tap.
      const needsPermission = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission;
      const onFirstTap = () => {
        needsPermission!
          .call(DeviceOrientationEvent)
          .then((res) => res === "granted" && listen())
          .catch(() => {});
      };
      if (needsPermission) window.addEventListener("touchend", onFirstTap, { once: true, passive: true });
      else listen();

      return () => {
        window.removeEventListener("deviceorientation", onOrient);
        window.removeEventListener("touchend", onFirstTap);
      };
    };

    let stop = () => {};
    const start = () => {
      stop();
      target = null;
      stop = small.matches ? startTilt() : startPointer();
    };
    start();
    small.addEventListener("change", start);
    return () => {
      small.removeEventListener("change", start);
      io.disconnect();
      stop();
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
