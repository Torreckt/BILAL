import type { Metadata } from "next";
import { REQUEST_ROLES, requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { contactIntents, intentLabel, statusLabels } from "@/lib/site";
import { Badge, Flash, statusTone, when, type Search } from "../../ui";

export const metadata: Metadata = { title: "الطلبات" };
const PAGE = 25;

type Row = {
  id: string; ref: string; type: string; status: string; name: string; business: string | null;
  services: string[]; created_at: Date; assignee: string | null; notify_status: string;
};

export default async function Requests({ searchParams }: { searchParams: Search }) {
  await requireUser(...REQUEST_ROLES);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const isId = (v?: string) => !!v && /^[0-9a-f-]{36}$/.test(v);
  const like = sp.q ? `%${sp.q.slice(0, 80).replace(/[%_\\]/g, "\\$&")}%` : null;

  const where = sql`
    ${like ? sql`(r.name ilike ${like} or r.ref ilike ${like} or r.phone ilike ${like} or r.email ilike ${like} or r.business ilike ${like})` : sql`true`}
    and ${sp.type ? sql`r.type = ${sp.type}` : sql`true`}
    and ${sp.status ? sql`r.status = ${sp.status}` : sql`true`}
    and ${sp.service ? sql`${sp.service} = any(r.services)` : sql`true`}
    and ${isId(sp.assignee) ? sql`r.assignee_id = ${sp.assignee!}` : sp.assignee === "none" ? sql`r.assignee_id is null` : sql`true`}
    and ${isDate(sp.from) ? sql`r.created_at >= (${sp.from!}::date at time zone 'Asia/Riyadh')` : sql`true`}
    and ${isDate(sp.to) ? sql`r.created_at < ((${sp.to!}::date + 1) at time zone 'Asia/Riyadh')` : sql`true`}
    and ${sp.open ? sql`r.status <> 'closed'` : sql`true`}
    and ${sp.notify === "failed" ? sql`r.notify_status = 'failed'` : sql`true`}
    and ${sp.follow ? sql`((r.status = 'new' and r.created_at < now() - interval '1 day')
          or (r.status not in ('new', 'closed') and r.updated_at < now() - interval '3 days'))` : sql`true`}`;

  const [rows, [{ total }], services, staff] = await Promise.all([
    sql<Row[]>`select r.id, r.ref, r.type, r.status, r.name, r.business, r.services, r.created_at, r.notify_status, u.name as assignee
               from requests r left join users u on u.id = r.assignee_id
               where ${where} order by r.created_at desc limit ${PAGE} offset ${(page - 1) * PAGE}`,
    sql<{ total: number }[]>`select count(*)::int as total from requests r where ${where}`,
    sql<{ slug: string; title: string }[]>`select slug, title from services order by position`,
    sql<{ id: string; name: string }[]>`select id, name from users where role in ('owner', 'agent') and active order by name`,
  ]);
  const title = (slug: string) => services.find((s) => s.slug === slug)?.title ?? slug;
  const pageLink = (p: number) => `?${new URLSearchParams({ ...(sp as Record<string, string>), page: String(p) })}`;
  const pages = Math.ceil(total / PAGE);

  return (
    <>
      <h1 className="adm-title">الطلبات</h1>
      <Flash sp={sp} />
      <form className="adm-filters" method="get">
        <label className="adm-field adm-field--grow">
          <span>بحث</span>
          <input name="q" defaultValue={sp.q} placeholder="اسم، رقم مرجعي، جوال، إيميل" />
        </label>
        <label className="adm-field">
          <span>النوع</span>
          <select name="type" defaultValue={sp.type ?? ""}>
            <option value="">الكل</option>
            {contactIntents.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>الحالة</span>
          <select name="status" defaultValue={sp.status ?? ""}>
            <option value="">الكل</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>الخدمة</span>
          <select name="service" defaultValue={sp.service ?? ""}>
            <option value="">الكل</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>المسؤول</span>
          <select name="assignee" defaultValue={sp.assignee ?? ""}>
            <option value="">الكل</option>
            <option value="none">بدون مسؤول</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>من تاريخ</span>
          <input type="date" name="from" defaultValue={sp.from} />
        </label>
        <label className="adm-field">
          <span>إلى تاريخ</span>
          <input type="date" name="to" defaultValue={sp.to} />
        </label>
        <button className="adm-btn" type="submit">تصفية</button>
        <a className="adm-link" href="/admin/requests">مسح</a>
      </form>

      <p className="adm-muted">{total} طلب</p>
      {rows.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>المرجع</th><th>العميل</th><th>النوع</th><th>الحالة</th><th>المسؤول</th><th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="المرجع">
                    <a className="adm-ref" href={`/admin/requests/${r.id}`} dir="ltr">{r.ref}</a>
                  </td>
                  <td data-label="العميل">
                    {r.name}
                    {r.business && <span className="adm-muted"> · {r.business}</span>}
                  </td>
                  <td data-label="النوع">
                    {intentLabel(r.type)}
                    {r.services.length > 0 && <span className="adm-muted"> · {r.services.map(title).join("، ")}</span>}
                  </td>
                  <td data-label="الحالة">
                    <Badge tone={statusTone(r.status)}>{statusLabels[r.status]}</Badge>
                    {r.notify_status === "failed" && <Badge tone="red">التنبيه فشل</Badge>}
                  </td>
                  <td data-label="المسؤول">{r.assignee ?? <span className="adm-muted">بدون</span>}</td>
                  <td data-label="التاريخ"><time>{when(r.created_at)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="adm-card adm-muted">ما فيه طلبات تطابق التصفية.</p>
      )}
      {pages > 1 && (
        <nav className="adm-pager" aria-label="الصفحات">
          {page > 1 && <a className="adm-btn" href={pageLink(page - 1)}>السابق</a>}
          <span>صفحة {page} من {pages}</span>
          {page < pages && <a className="adm-btn" href={pageLink(page + 1)}>التالي</a>}
        </nav>
      )}
    </>
  );
}
