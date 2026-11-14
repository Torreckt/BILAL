import { Eye } from "@/components/Eye";
import { CONTENT_ROLES, REQUEST_ROLES, requireUser, roleLabels, type Role } from "@/lib/auth";
import { sql } from "@/lib/db";
import { logout } from "../actions";
import { Menu } from "../Menu";

const menu: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "نظرة عامة", roles: ["owner", "agent", "editor"] },
  { href: "/admin/requests", label: "الطلبات", roles: REQUEST_ROLES },
  { href: "/admin/services", label: "الخدمات", roles: CONTENT_ROLES },
  { href: "/admin/works", label: "الأعمال", roles: CONTENT_ROLES },
  { href: "/admin/faqs", label: "الأسئلة الشائعة", roles: CONTENT_ROLES },
  { href: "/admin/settings", label: "الإعدادات", roles: CONTENT_ROLES },
  { href: "/admin/users", label: "المستخدمون", roles: ["owner"] },
  { href: "/admin/audit", label: "سجل التغييرات", roles: ["owner"] },
  { href: "/admin/account", label: "حسابي", roles: ["owner", "agent", "editor"] },
];

export default async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ n }] = REQUEST_ROLES.includes(user.role)
    ? await sql<{ n: number }[]>`select count(*)::int as n from requests where status = 'new'`
    : [{ n: 0 }];
  return (
    <div className="adm-shell">
      <a className="skip" href="#adm-main">
        تخطَّ إلى المحتوى
      </a>
      <header className="adm-side">
        <a className="adm-brand" href="/admin">
          <Eye className="adm-brand__eye" tone="light" />
          <span dir="ltr">Mainstream</span>
        </a>
        <nav aria-label="أقسام اللوحة">
          <Menu
            items={menu
              .filter((m) => m.roles.includes(user.role))
              .map((m) => ({ href: m.href, label: m.label, count: m.href === "/admin/requests" ? n : 0 }))}
          />
        </nav>
        <div className="adm-me">
          <p>
            {user.name}
            <span>{roleLabels[user.role]}</span>
          </p>
          <a href="/" target="_blank" rel="noopener">
            افتح الموقع
          </a>
          <form action={logout}>
            <button type="submit">خروج</button>
          </form>
        </div>
      </header>
      <main id="adm-main" className="adm-main">
        {children}
      </main>
    </div>
  );
}
