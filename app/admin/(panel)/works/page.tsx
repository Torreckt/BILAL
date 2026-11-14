import type { Metadata } from "next";
import Image from "next/image";
import { CONTENT_ROLES, requireUser } from "@/lib/auth";
import { getWorks } from "@/lib/content";
import { Badge, Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "الأعمال" };

export default async function Works({ searchParams }: { searchParams: Search }) {
  await requireUser(...CONTENT_ROLES);
  const rows = await getWorks(true);
  return (
    <>
      <div className="adm-head">
        <h1 className="adm-title">الأعمال</h1>
        <a className="adm-btn adm-btn--red" href="/admin/works/new">أضف عمل</a>
      </div>
      <Flash sp={await searchParams} />
      {rows.length ? (
        <ul className="adm-tiles">
          {rows.map((w) => (
            <li key={w.id}>
              <a href={`/admin/works/${w.id}`}>
                <span className="adm-tiles__shot">{w.cover && <Image src={w.cover} alt="" fill sizes="240px" />}</span>
                <strong>{w.title}</strong>
                <span className="adm-muted">{w.category}</span>
                <Badge tone={w.status === "published" ? "green" : "paper"}>{w.status === "published" ? "منشور" : "مسودة"}</Badge>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="adm-card adm-muted">ما فيه أعمال. أضف أول عمل وارفع صوره أو فيديوهاته.</p>
      )}
    </>
  );
}
