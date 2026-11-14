import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { REQUEST_ROLES } from "@/lib/roles";
import { serviceTitles } from "@/lib/admin/content";
import { listRequests, parseRequestFilters } from "@/lib/admin/requests";
import { listRequestStaff } from "@/lib/admin/users";
import { contactIntents, intentLabel, statusLabels } from "@/lib/intents";
import { Badge, Flash, statusTone, when, type Search } from "../../ui";

export const metadata: Metadata = { title: "الطلبات" };
const PAGE = 25;

export default async function Requests({ searchParams }: { searchParams: Search }) {
  await requireUser(...REQUEST_ROLES);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters = parseRequestFilters(sp);
  const [{ rows, total }, services, staff] = await Promise.all([
    listRequests(filters, page, PAGE),
    serviceTitles(),
    listRequestStaff(),
  ]);
  const title = services.title;
  const pageLink = (p: number) => `?${new URLSearchParams({ ...filters, page: String(p) })}`;
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
              <option key={c.id} value={c.id}>{c.noun}</option>
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
            {services.list.map((s) => (
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
