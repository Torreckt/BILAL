import { CONTENT_ROLES, REQUEST_ROLES, requireUser } from "@/lib/auth";
import { contentCounts } from "@/lib/admin/content";
import { recentRequests, requestStats } from "@/lib/admin/requests";
import { eventCounts } from "@/lib/events";
import { intentLabel, statusLabels } from "@/lib/intents";
import { Badge, Flash, statusTone, when, type Search } from "../ui";

export default async function Overview({ searchParams }: { searchParams: Search }) {
  const user = await requireUser();
  const sp = await searchParams;
  const seesRequests = REQUEST_ROLES.includes(user.role);
  const seesContent = CONTENT_ROLES.includes(user.role);

  const [stats, recent, count, content] = await Promise.all([
    seesRequests ? requestStats(user.id) : undefined,
    seesRequests ? recentRequests(6) : [],
    seesRequests ? eventCounts(30) : () => 0,
    seesContent ? contentCounts() : undefined,
  ]);

  return (
    <>
      <h1 className="adm-title">هلا {user.name}</h1>
      {sp.denied && <p className="adm-flash adm-flash--error" role="alert">ما عندك صلاحية لهذي الصفحة.</p>}
      <Flash sp={sp} />

      {stats && (
        <>
          <ul className="adm-stats">
            <li className={stats.fresh ? "is-hot" : ""}>
              <a href="/admin/requests?status=new">
                <strong>{stats.fresh}</strong> طلبات جديدة
              </a>
            </li>
            <li className={stats.follow ? "is-hot" : ""}>
              <a href="/admin/requests?follow=1">
                <strong>{stats.follow}</strong> تحتاج متابعة
              </a>
            </li>
            <li>
              <a href={`/admin/requests?assignee=${user.id}`}>
                <strong>{stats.mine}</strong> مسندة لي
              </a>
            </li>
            <li>
              <a href="/admin/requests?open=1">
                <strong>{stats.open}</strong> طلبات مفتوحة
              </a>
            </li>
            {stats.failed > 0 && (
              <li className="is-hot">
                <a href="/admin/requests?notify=failed">
                  <strong>{stats.failed}</strong> تنبيهات بريد فشلت
                </a>
              </li>
            )}
          </ul>
          <p className="adm-muted">
            آخر 30 يوم · طلبات محفوظة من الموقع: {count("request_saved")} · نقرات «تابع على واتساب»: {count("whatsapp_click")}
          </p>

          <section className="adm-card">
            <h2>آخر الطلبات</h2>
            {recent.length ? (
              <ul className="adm-list">
                {recent.map((r) => (
                  <li key={r.id}>
                    <a href={`/admin/requests/${r.id}`}>
                      <span className="adm-ref" dir="ltr">{r.ref}</span>
                      <span>{r.name}</span>
                      <span className="adm-muted">{intentLabel(r.type)}</span>
                      <Badge tone={statusTone(r.status)}>{statusLabels[r.status]}</Badge>
                      <time className="adm-muted">{when(r.created_at)}</time>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="adm-muted">ما وصلت طلبات لسا. أول طلب من نموذج الموقع بيظهر هنا.</p>
            )}
          </section>
        </>
      )}

      {content && (
        <section className="adm-card">
          <h2>المحتوى المنشور</h2>
          <ul className="adm-stats adm-stats--plain">
            <li>
              <a href="/admin/services">
                <strong>{content.services}</strong> خدمات
              </a>
            </li>
            <li>
              <a href="/admin/works">
                <strong>{content.works}</strong> أعمال
              </a>
            </li>
            <li>
              <a href="/admin/faqs">
                <strong>{content.faqs}</strong> أسئلة
              </a>
            </li>
            <li>
              <span>
                <strong>{content.drafts}</strong> مسودات غير منشورة
              </span>
            </li>
          </ul>
        </section>
      )}
    </>
  );
}
