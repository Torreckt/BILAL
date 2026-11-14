import { Eye } from "@/components/Eye";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES, REQUEST_ROLES, roleLabels, type Role, OWNER_ROLES, ROLES } from "@/lib/roles";
import { countNewRequests } from "@/lib/admin/requests";
import { logout } from "../actions/auth";
import { Menu } from "../Menu";

const menu: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "نظرة عامة", roles: [...ROLES] },
  { href: "/admin/requests", label: "الطلبات", roles: REQUEST_ROLES },
  { href: "/admin/services", label: "الخدمات", roles: CONTENT_ROLES },
  { href: "/admin/works", label: "الأعمال", roles: CONTENT_ROLES },
  { href: "/admin/faqs", label: "الأسئلة الشائعة", roles: CONTENT_ROLES },
  { href: "/admin/settings", label: "الإعدادات", roles: CONTENT_ROLES },
  { href: "/admin/users", label: "المستخدمون", roles: OWNER_ROLES },
  { href: "/admin/audit", label: "سجل التغييرات", roles: OWNER_ROLES },
  { href: "/admin/account", label: "حسابي", roles: [...ROLES] },
];

export default async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const n = REQUEST_ROLES.includes(user.role) ? await countNewRequests() : 0;
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
