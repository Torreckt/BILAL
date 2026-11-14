import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { REQUEST_ROLES, requireUser } from "@/lib/auth";
import { serviceTitles } from "@/lib/admin/content";
import { getRequest, requestNotes } from "@/lib/admin/requests";
import { listRequestStaff } from "@/lib/admin/users";
import { auditFor } from "@/lib/audit";
import { isUuid } from "@/lib/validate";
import { formatDay } from "@/lib/dates";
import { intentLabel, statusLabels, statusesFor } from "@/lib/intents";
import { deleteRequest, retryNotify, updateRequest } from "../../../actions/requests";
import { Badge, Flash, statusTone, when, type Search } from "../../../ui";

export const metadata: Metadata = { title: "تفاصيل الطلب" };

const actionText: Record<string, (m: Record<string, string>) => string> = {
  "request.status": (m) => `غيّر الحالة من «${m.from}» إلى «${m.to}»`,
  "request.assigned": (m) => `أسند الطلب إلى: ${m.to}`,
  "request.note": () => "أضاف ملاحظة",
};

export default async function RequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const user = await requireUser(...REQUEST_ROLES);
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const r = await getRequest(id);
  if (!r) notFound();
  const [notes, history, staff, services] = await Promise.all([requestNotes(id), auditFor("request", id), listRequestStaff(), serviceTitles()]);
  const facts: [string, React.ReactNode][] = [
    ["الاسم", r.name],
    ["الجوال", r.phone && <a href={`tel:${r.phone}`} dir="ltr">{r.phone}</a>],
    ["الإيميل", r.email && <a href={`mailto:${r.email}`} dir="ltr">{r.email}</a>],
    [r.type === "partner" ? "الجهة" : "النشاط", r.business],
    ["نوع النشاط", r.sector],
    ["الخدمات", r.services.map(services.title).join("، ")],
    ["نوع الاجتماع", r.meeting_type],
    ["اليوم المفضل", r.meeting_day && formatDay(new Date(r.meeting_day).toISOString().slice(0, 10))],
    ["الفترة المفضلة", r.meeting_time],
    ["الموضوع", r.subject],
    ["أُرسل من", r.source && <span dir="ltr">{r.source}</span>],
    ["تاريخ الطلب", when(r.created_at)],
  ];
  const wa = r.phone?.replace(/^\+/, "").replace(/^0(5\d{8})$/, "966$1");

  return (
    <>
      <p className="adm-crumb">
        <a href="/admin/requests">الطلبات</a> / <span dir="ltr">{r.ref}</span>
      </p>
      <h1 className="adm-title">
        {intentLabel(r.type)} <Badge tone={statusTone(r.status)}>{statusLabels[r.status]}</Badge>
      </h1>
      <Flash sp={await searchParams} />

      {r.notify_status !== "sent" && (
        <form className="adm-flash adm-flash--error adm-row" action={retryNotify}>
          <input type="hidden" name="id" value={r.id} />
          <span>
            {r.notify_status === "failed"
              ? `تنبيه البريد ما وصل للفريق (${r.notify_attempts} محاولة): ${r.notify_error ?? ""}`
              : "تنبيه البريد قيد الإرسال."}{" "}
            الطلب محفوظ هنا.
          </span>
          <button className="adm-btn" type="submit">أعد إرسال التنبيه</button>
        </form>
      )}

      <div className="adm-cols">
        <section className="adm-card">
          <h2>بيانات العميل والطلب</h2>
          <dl className="adm-facts">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {r.message && (
            <>
              <h3>الرسالة</h3>
              <p className="adm-message">{r.message}</p>
            </>
          )}
          {wa && (
            <a className="adm-btn" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              افتح محادثة واتساب مع العميل
            </a>
          )}
        </section>

        <div className="adm-stack">
          <form className="adm-card adm-stack" action={updateRequest}>
            <h2>المتابعة</h2>
            <input type="hidden" name="id" value={r.id} />
            <label className="adm-field">
              <span>الحالة</span>
              <select name="status" defaultValue={r.status}>
                {statusesFor(r.type).map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>المسؤول</span>
              <select name="assignee" defaultValue={r.assignee_id ?? ""}>
                <option value="">بدون مسؤول</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>ملاحظة داخلية <em>(اختياري، ما يشوفها العميل)</em></span>
              <textarea name="note" rows={3} maxLength={2000} />
            </label>
            <button className="adm-btn adm-btn--red" type="submit">حفظ</button>
          </form>

          <section className="adm-card">
            <h2>الملاحظات الداخلية</h2>
            {notes.length ? (
              <ul className="adm-notes">
                {notes.map((n) => (
                  <li key={n.id}>
                    <p>{n.body}</p>
                    <span className="adm-muted">{n.author ?? "مستخدم محذوف"} · {when(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">ما فيه ملاحظات.</p>
            )}
          </section>

          <section className="adm-card">
            <h2>سجل الطلب</h2>
            <ul className="adm-notes">
              {history.map((h) => (
                <li key={h.id}>
                  <p>{h.actor_name ?? "النظام"}: {actionText[h.action]?.(h.meta) ?? h.action}</p>
                  <span className="adm-muted">{when(h.created_at)}</span>
                </li>
              ))}
              <li>
                <p>وصل الطلب من الموقع</p>
                <span className="adm-muted">{when(r.created_at)}</span>
              </li>
            </ul>
          </section>

          {user.role === "owner" && (
            <form className="adm-card adm-row" action={deleteRequest}>
              <input type="hidden" name="id" value={r.id} />
              <span className="adm-muted">حذف الطلب يمسح بيانات العميل نهائياً.</span>
              <label className="adm-check">
                <input type="checkbox" required /> متأكد
              </label>
              <button className="adm-btn adm-btn--danger" type="submit">حذف الطلب</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
