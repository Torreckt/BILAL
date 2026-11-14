"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "./Eye";
import { Icon, social } from "./icons";
import { DEFAULT_MESSAGE, whatsappLink, type Links } from "@/lib/site";

const pages = [
  { href: "/work", label: "أعمالنا" },
  { href: "/#why", label: "ليش ماين ستريم" },
  { href: "/#process", label: "كيف نشتغل" },
  { href: "/#faq", label: "الأسئلة الشائعة" },
  { href: "/#contact", label: "تواصل معنا" },
  { href: "/privacy", label: "سياسة الخصوصية" },
];

export function Footer({ links, services }: { links: Links; services: { slug: string; title: string }[] }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const socials = [
    { label: "WhatsApp", href: whatsappLink(links.whatsapp, DEFAULT_MESSAGE), icon: social.whatsapp },
    { label: "Instagram", href: `https://instagram.com/${links.instagram}`, icon: social.instagram },
    { label: "TikTok", href: `https://www.tiktok.com/@${links.tiktok}`, icon: social.tiktok },
  ];

  // Columns rise into place the first time the footer scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 1200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer ref={ref} className={`footer ${visible ? "is-visible" : ""}`}>
      <div className="wrap footer__grid">
        <div className="footer__col footer__brand">
          <a className="footer__logo" href="/" aria-label="Mainstream، الصفحة الرئيسية">
            <Eye className="footer__eye" tone="light" />
            <span dir="ltr">Mainstream</span>
          </a>
          <p className="footer__about">وكالة تسويق متكاملة في الرياض. نصنع الضجة.. وأنت تملك الأضواء.</p>
          <ul className="footer__social" aria-label="حساباتنا">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                  <Icon>{s.icon}</Icon>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer__col" aria-labelledby="footer-services">
          <h2 id="footer-services" className="footer__title">
            الخدمات
          </h2>
          <ul className="footer__links footer__links--two">
            {services.map((s) => (
              <li key={s.slug}>
                <a href={`/services/${s.slug}`}>{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer__col" aria-labelledby="footer-pages">
          <h2 id="footer-pages" className="footer__title">
            الموقع
          </h2>
          <ul className="footer__links">
            {pages.map((p) => (
              <li key={p.href}>
                <a href={p.href}>{p.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="wrap footer__bottom" suppressHydrationWarning>
        <span dir="ltr">© {new Date().getFullYear()} Mainstream.</span>
      </p>

      <button
        type="button"
        className={`footer__top ${showTop ? "is-shown" : ""}`}
        aria-label="العودة للأعلى"
        tabIndex={showTop ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
        </svg>
      </button>
    </footer>
  );
}
