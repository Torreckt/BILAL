"use client";

import { useEffect, useState } from "react";
import { Eye } from "./Eye";
import { WhatsAppButton } from "./WhatsAppButton";

const links = [
  { href: "#services", label: "الخدمات" },
  { href: "#team", label: "الفريق" },
  { href: "#packages", label: "الباقات" },
  { href: "#process", label: "كيف نشتغل" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape or when the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 861px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <header className={`nav ${scrolled || open ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}>
      <div className="nav__inner wrap">
        <a className="brand" href="#top" aria-label="ماين ستريم — الرئيسية">
          <Eye className="brand__eye" />
          <span className="brand__word" dir="ltr">
            Mainstream
          </span>
          <span className="tag tag--red brand__tag" dir="ltr">
            WATCH US
          </span>
        </a>
        <nav id="nav-menu" className="nav__menu" aria-label="الأقسام">
          <ul className="nav__links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <WhatsAppButton variant="ink" className="nav__cta">
          احجز اجتماع
        </WhatsAppButton>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav__bars" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
