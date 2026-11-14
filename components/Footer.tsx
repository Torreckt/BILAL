"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "./Eye";
import { Icon, social } from "./icons";
import { DEFAULT_MESSAGE, whatsappLink, type Links } from "@/lib/site";

const MAP_LINK = "https://www.google.com/maps/place/Riyadh+Saudi+Arabia";

// Click ripple on the social squares, spreading from where the visitor pressed.
function ripple(e: React.MouseEvent<HTMLAnchorElement>) {
  const a = e.currentTarget;
  const r = a.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.className = "footer__ripple";
  dot.style.left = `${e.clientX - r.left}px`;
  dot.style.top = `${e.clientY - r.top}px`;
  a.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
}

export function Footer({ links, services }: { links: Links; services: { slug: string; title: string }[] }) {
  const socials = [
    { label: "TikTok", href: `https://www.tiktok.com/@${links.tiktok}`, icon: social.tiktok },
    { label: "Instagram", href: `https://instagram.com/${links.instagram}`, icon: social.instagram },
    { label: "WhatsApp", href: whatsappLink(links.whatsapp, DEFAULT_MESSAGE), icon: social.whatsapp },
  ];
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // Columns rise into place the first time the footer scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer ref={ref} className={`footer ${visible ? "is-visible" : ""}`}>
      <div className="wrap footer__grid">
        <div className="footer__col">
          <a className="footer__logo" href="/" aria-label="Mainstream، الصفحة الرئيسية">
            <span className="footer__badge">
              <Eye className="footer__eye" tone="light" wave={false} />
            </span>
            <span className="footer__word" dir="ltr">
              Main<span>stream</span>
            </span>
          </a>
          <p className="footer__about">
            وكالة تسويق متكاملة في الرياض: تسويق وإعلانات، سوشال ميديا، كتابة محتوى، تصوير، مونتاج، تصميم مواقع،
            هوية، وتدريب الكوفيهات.
          </p>
        </div>

        <div className="footer__col">
          <h3 className="footer__title">تواصل معنا</h3>
          <ul className="footer__social" aria-label="حساباتنا">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} onClick={ripple}>
                  <Icon>{s.icon}</Icon>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__title">موقعنا</h3>
          <div className="footer__map">
            <iframe
              title="خريطة الرياض"
              src="https://maps.google.com/maps?q=Riyadh,+Saudi+Arabia&t=&z=11&ie=UTF8&iwloc=B&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a className="footer__maplink" href={MAP_LINK} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
              />
            </svg>
            افتح في خرائط Google
          </a>
        </div>
      </div>

      <nav className="wrap footer__nav" aria-label="روابط الموقع">
        <ul>
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`/services/${s.slug}`}>{s.title}</a>
            </li>
          ))}
          <li>
            <a href="/work">أعمالنا</a>
          </li>
          <li>
            <a href="/privacy">سياسة الخصوصية</a>
          </li>
        </ul>
      </nav>

      <div className="wrap footer__bottom">
        <p suppressHydrationWarning>
          <span dir="ltr">© {new Date().getFullYear()} Mainstream.</span> صُمّم وطُوّر بواسطة{" "}
          <a href="/" dir="ltr">
            Mainstream
          </a>
        </p>
      </div>

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
