"use client";

import { useEffect } from "react";

// Every eye on the page watches the visitor. Decorative, so it eases toward the pointer instead of snapping.
export function EyeTracker() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX_X = 9;
    const MAX_Y = 5;
    let px = -1;
    let py = -1;
    let raf = 0;
    const state = new WeakMap<Element, { x: number; y: number }>();

    const tick = () => {
      raf = 0;
      let moving = false;
      document.querySelectorAll<SVGGElement>("[data-pupil]").forEach((g) => {
        const svg = g.ownerSVGElement;
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.44;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        const tx = (dx / dist) * MAX_X * reach;
        const ty = (dy / dist) * MAX_Y * reach;
        const s = state.get(g) ?? { x: 0, y: 0 };
        s.x += (tx - s.x) * 0.14;
        s.y += (ty - s.y) * 0.14;
        state.set(g, s);
        if (Math.abs(tx - s.x) > 0.05 || Math.abs(ty - s.y) > 0.05) moving = true;
        g.setAttribute("transform", `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);
      });
      if (moving) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
