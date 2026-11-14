import type { Metadata } from "next";
import { CONTENT_ROLES, requireUser } from "@/lib/auth";
import { getServices } from "@/lib/content";
import { Badge, Flash, type Search } from "../../ui";

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
              <Badge tone={s.status === "published" ? "green" : "paper"}>{s.status === "published" ? "منشورة" : "مسودة"}</Badge>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
