"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "./Eye";
import {
  DEFAULT_MESSAGE,
  EMAIL,
  HOURS,
  INSTAGRAM_HANDLE,
  TIKTOK_HANDLE,
  WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/site";

const icons = {
  mail: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </g>
  ),
  phone: (
    <path
      fill="currentColor"
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"
    />
  ),
  tiktok: (
    <path
      fill="currentColor"
      d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.4 6.4 0 1 0 5.4 6.3V8.6a8.2 8.2 0 0 0 4.8 1.5V6.7a4.8 4.8 0 0 1-4.8-4.7Z"
    />
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </g>
  ),
  whatsapp: (
    <path
      fill="currentColor"
      d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
    />
  ),
};

const socials = [
  { label: "TikTok", href: `https://www.tiktok.com/@${TIKTOK_HANDLE}`, icon: icons.tiktok },
  { label: "Instagram", href: `https://instagram.com/${INSTAGRAM_HANDLE}`, icon: icons.instagram },
  { label: "WhatsApp", href: whatsappLink(DEFAULT_MESSAGE), icon: icons.whatsapp },
];

// 966500000000 → +966 50 000 0000
const phone = `+${WHATSAPP_NUMBER.slice(0, 3)} ${WHATSAPP_NUMBER.slice(3, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`;

const contacts: { label: string; href?: string; icon: React.ReactNode; ltr?: boolean }[] = [
  { label: EMAIL, href: `mailto:${EMAIL}`, icon: icons.mail, ltr: true },
  { label: phone, href: whatsappLink(DEFAULT_MESSAGE), icon: icons.phone, ltr: true },
  { label: `instagram.com/${INSTAGRAM_HANDLE}`, href: `https://instagram.com/${INSTAGRAM_HANDLE}`, icon: icons.instagram, ltr: true },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

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

export function Footer() {
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
          <a className="footer__logo" href="#top" aria-label="ماين ستريم — الرئيسية">
            <span className="footer__badge">
              <Eye className="footer__eye" tone="light" wave={false} />
            </span>
            <span className="footer__word" dir="ltr">
              Main<span>stream</span>
            </span>
          </a>
          <p className="footer__about">
            وكالة تسويق في الرياض. فريقك التسويقي المتكامل براتب موظف واحد: سوشال ميديا، تصوير وريلز، إعلانات مدفوعة،
            مؤثرين، وهوية.
          </p>
          <ul className="footer__social" aria-label="حساباتنا">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} onClick={ripple}>
                  <Icon>{s.icon}</Icon>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__title">تواصل معنا</h3>
          <ul className="footer__contact">
            {contacts.map((c) => (
              <li key={c.label}>
                <Icon>{c.icon}</Icon>
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" dir={c.ltr ? "ltr" : undefined}>
                    {c.label}
                  </a>
                ) : (
                  <span>{c.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__title">أوقات العمل</h3>
          <dl className="footer__hours">
            {HOURS.map(([day, time]) => (
              <div key={day}>
                <dt>{day}</dt>
                <dd dir="ltr">{time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="footer__col">
          <h3 className="footer__title">موقعنا</h3>
          <div className="footer__map">
            <iframe
              title="خريطة الرياض"
              src="https://maps.google.com/maps?q=Riyadh,+Saudi+Arabia&t=&z=11&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="wrap footer__bottom">
        <p suppressHydrationWarning>
          <span dir="ltr">© {new Date().getFullYear()} Mainstream.</span> صُمّم وطُوّر بواسطة{" "}
          <a href="#top" dir="ltr">
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
