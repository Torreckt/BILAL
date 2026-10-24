"use client";

import { useEffect, useRef, useState } from "react";
import { caseFiles } from "@/lib/site";

// One line icon per service, keyed by case file id.
const icons: Record<string, React.ReactNode> = {
  social: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="m10 8.5 4 2-4 2z" fill="currentColor" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </g>
  ),
  ads: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 10v4h3l7 4V6L7 10H4Z" />
      <path d="M17.5 9a4 4 0 0 1 0 6M7 14l1.5 5h2.5L10 15" />
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

export function ServiceCards() {
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
      {caseFiles.map((f, i) => (
        <li key={f.id} className={`svc ${lit === i ? "is-lit" : ""}`} tabIndex={0}>
          <svg className="svc__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {icons[f.id]}
          </svg>
          <h3 className="svc__title">{f.title}</h3>
          <p className="svc__line">{f.line}</p>
          <ul className="svc__items">
            {f.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
