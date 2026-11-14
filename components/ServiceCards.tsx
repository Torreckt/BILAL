"use client";

import { useEffect, useRef, useState } from "react";

// One line icon per service, keyed by case file id.
const icons: Record<string, React.ReactNode> = {
  social: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="m10 8.5 4 2-4 2z" fill="currentColor" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </g>
  ),
  marketing: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 10v4h3l7 4V6L7 10H4Z" />
      <path d="M17.5 9a4 4 0 0 1 0 6M7 14l1.5 5h2.5L10 15" />
    </g>
  ),
  content: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 7.5 2 2M13 20h7" />
    </g>
  ),
  photo: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.8l1.5-2.2h6.4L16.7 7h2.8A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.6" />
    </g>
  ),
  video: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7.5 5l2 4M12.5 5l2 4M17.5 5l2 4" />
      <path d="m10.5 12 4 2.2-4 2.2v-4.4Z" fill="currentColor" />
    </g>
  ),
  web: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18" />
      <circle cx="6" cy="6.3" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8.2" cy="6.3" r="0.6" fill="currentColor" stroke="none" />
      <path d="m9.5 12-2.5 2.5 2.5 2.5M14.5 12l2.5 2.5-2.5 2.5" />
    </g>
  ),
  training: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5" />
    </g>
  ),
  influence: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </g>
  ),
  identity: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.3-1-1.6-1-2.8 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </g>
  ),
};

const fallbackIcon = (
  <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9M7.5 12h9" />
  </g>
);

export function ServiceIcon({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {icons[slug] ?? fallbackIcon}
    </svg>
  );
}

type Card = { slug: string; title: string; line: string; items: string[] };

export function ServiceCards({ services }: { services: Card[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [lit, setLit] = useState<number | null>(null);

  // Touch screens have no hover, so the red highlight follows the card scrolled into the middle of the screen.
  useEffect(() => {
    if (!matchMedia("(hover: none), (pointer: coarse)").matches) return;
    const cards = Array.from(listRef.current?.children ?? []);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setLit(cards.indexOf(e.target));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={listRef} className={`svc-grid ${lit !== null ? "has-lit" : ""}`}>
      {services.map((f, i) => (
        <li key={f.slug} className={`svc ${lit === i ? "is-lit" : ""}`}>
          <ServiceIcon slug={f.slug} className="svc__icon" />
          <h3 className="svc__title">
            {/* The link stretches over the whole card. */}
            <a className="svc__link" href={`/services/${f.slug}`}>
              {f.title}
            </a>
          </h3>
          <p className="svc__line">{f.line}</p>
          <ul className="svc__items">
            {f.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <span className="svc__more" aria-hidden="true">
            <span>تفاصيل الخدمة</span> ←
          </span>
        </li>
      ))}
    </ul>
  );
}
