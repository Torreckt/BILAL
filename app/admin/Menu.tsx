"use client";

import { usePathname } from "next/navigation";

type Item = { href: string; label: string; count?: number };

// Sidebar links, with the current section marked.
export function Menu({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <ul className="adm-menu">
      {items.map((m) => {
        const current = m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
        return (
          <li key={m.href}>
            <a href={m.href} aria-current={current ? "page" : undefined}>
              {m.label}
              {!!m.count && <span className="adm-count">{m.count}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
