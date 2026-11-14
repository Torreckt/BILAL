import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES } from "@/lib/roles";
import { getServices } from "@/lib/content";
import { PublishedBadge, Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "الخدمات" };

export default async function Services({ searchParams }: { searchParams: Search }) {
  await requireUser(...CONTENT_ROLES);
  const rows = await getServices(true);
  return (
    <>
      <div className="adm-head">
        <h1 className="adm-title">الخدمات</h1>
        <a className="adm-btn adm-btn--red" href="/admin/services/new">أضف خدمة</a>
      </div>
      <Flash sp={await searchParams} />
      <ul className="adm-list adm-card">
        {rows.map((s) => (
          <li key={s.id}>
            <a href={`/admin/services/${s.id}`}>
              <span className="adm-muted">{s.position}</span>
              <strong>{s.title}</strong>
              <span className="adm-muted" dir="ltr">/services/{s.slug}</span>
              <PublishedBadge status={s.status} feminine />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
