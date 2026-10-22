"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "./Eye";
import { WhatsAppButton } from "./WhatsAppButton";
import { roles } from "@/lib/site";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Hero() {
  const wallRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLLIElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [active, setActive] = useState<number | null>(null);

  function moveReticle(i: number) {
    const frame = frameRefs.current[i];
    const reticle = reticleRef.current;
    if (!frame || !reticle) return;
    // The wall is rotated; offsetLeft/Top give untransformed positions inside it.
    reticle.style.width = `${frame.offsetWidth}px`;
    reticle.style.height = `${frame.offsetHeight}px`;
    reticle.style.transform = `translate(${frame.offsetLeft}px, ${frame.offsetTop}px)`;
  }

  useEffect(() => {
    const motionOk = document.documentElement.dataset.motion === "ok";
    if (!motionOk) {
      setPhase("done");
      return;
    }
    let cancelled = false;
    const labels = labelRefs.current;
    labels.forEach((el) => el && (el.textContent = ""));
    setPhase("running");

    (async () => {
      await wait(450);
      for (let i = 0; i < roles.length; i++) {
        if (cancelled) return;
        setActive(i);
        moveReticle(i);
        await wait(230);
        const chars = Array.from(roles[i]);
        for (let k = 1; k <= chars.length; k++) {
          if (cancelled) return;
          const el = labels[i];
          if (el) el.textContent = chars.slice(0, k).join("");
          await wait(28);
        }
        await wait(70);
      }
      if (cancelled) return;
      setActive(null);
      setPhase("done");
    })();

    const onResize = () => setActive(null);
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      labels.forEach((el, i) => el && (el.textContent = roles[i]));
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <p className="ghost ghost--hero" aria-hidden="true">
        WATCH
      </p>

      <div className="hero__grid wrap">
      <div className="hero__head">
        <h1 id="hero-title" className="display hero__title">
          فريقك التسويقي المتكامل
        </h1>
        <p className="hero__lede">
          تسعة متخصصين يشتغلون على نشاطك من الرياض: محتوى، تصوير، إعلانات، مؤثرين، وهوية.{" "}
          <strong>براتب موظف واحد.</strong>
        </p>
        <div className="hero__actions">
          <WhatsAppButton size="lg">احجز اجتماعك على واتساب</WhatsAppButton>
          <a className="text-link" href="#packages">
            شوف الباقات والأسعار
          </a>
        </div>
      </div>

      <div className="hero__stage">
        <ul className="sr-only">
          {roles.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div
          className={`wall ${phase === "running" ? "is-running" : ""} ${phase === "done" ? "is-done" : ""}`}
          ref={wallRef}
          aria-hidden="true"
          onPointerLeave={() => phase === "done" && setActive(null)}
        >
          <ol className="wall__grid">
            {roles.map((role, i) => (
              <li
                key={role}
                className={`frame ${active === i ? "is-active" : ""}`}
                ref={(el) => {
                  frameRefs.current[i] = el;
                }}
                onPointerEnter={(e) => {
                  if (phase !== "done" || e.pointerType !== "mouse") return;
                  setActive(i);
                  moveReticle(i);
                }}
              >
                <Eye className="frame__eye" />
                <span className="frame__label">
                  <span
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                  >
                    {role}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className={`reticle ${active !== null ? "is-on" : ""}`} ref={reticleRef}>
            <span className="reticle__corner reticle__corner--tl" />
            <span className="reticle__corner reticle__corner--tr" />
            <span className="reticle__corner reticle__corner--bl" />
            <span className="reticle__corner reticle__corner--br" />
            <span className="reticle__cross" />
          </div>
          <p className="stamp">براتب موظف واحد.</p>
        </div>
        <p className="hero__side">وكالة تسويق كاملة تشتغل لك براتب موظف واحد</p>
      </div>
      </div>
    </section>
  );
}
