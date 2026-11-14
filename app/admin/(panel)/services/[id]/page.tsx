import type { Metadata } from "next";
import { CONTENT_ROLES, requireUser } from "@/lib/auth";
import { getServiceById } from "@/lib/admin/content";
import { loadEditable } from "../../../editable";
import { deleteContent, saveService } from "../../../actions/content";
import { PublishedBadge, Flash, type Search } from "../../../ui";

export const metadata: Metadata = { title: "تعديل خدمة" };

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  await requireUser(...CONTENT_ROLES);
  const s = await loadEditable((await params).id, getServiceById);
  return (
    <>
      <p className="adm-crumb">
        <a href="/admin/services">الخدمات</a> / {s?.title ?? "خدمة جديدة"}
      </p>
      <div className="adm-head">
        <h1 className="adm-title">
          {s?.title ?? "خدمة جديدة"}{" "}
          {s && <PublishedBadge status={s.status} feminine />}
        </h1>
        {s && (
          <a className="adm-btn" href={`/services/${s.slug}?preview=1`} target="_blank" rel="noopener">
            معاينة
          </a>
        )}
      </div>
      <Flash sp={await searchParams} />
      <form className="adm-card adm-stack" action={saveService}>
        <input type="hidden" name="id" value={s?.id ?? ""} />
        <div className="adm-grid">
          <label className="adm-field">
            <span>اسم الخدمة</span>
            <input name="title" required maxLength={120} defaultValue={s?.title} />
          </label>
          <label className="adm-field">
            <span>الرابط <em>(إنجليزي، مثل social)</em></span>
            <input name="slug" required maxLength={60} dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={s?.slug} />
          </label>
          <label className="adm-field">
            <span>الكلمة الخلفية <em>(إنجليزي، تظهر كبيرة خلف العنوان)</em></span>
            <input name="code" maxLength={20} dir="ltr" defaultValue={s?.code} />
          </label>
          <label className="adm-field">
            <span>الترتيب</span>
            <input name="position" type="number" defaultValue={s?.position ?? 0} />
          </label>
        </div>
        <label className="adm-field">
          <span>الجملة التعريفية <em>(تظهر في الكرت)</em></span>
          <input name="line" required maxLength={200} defaultValue={s?.line} />
        </label>
        <label className="adm-field">
          <span>نقاط الخدمة <em>(كل نقطة في سطر)</em></span>
          <textarea name="items" rows={4} defaultValue={s?.items.join("\n")} />
        </label>
        <label className="adm-field">
          <span>ملخص الصفحة</span>
          <textarea name="summary" rows={2} maxLength={600} defaultValue={s?.summary} />
        </label>
        <label className="adm-field">
          <span>محتوى الصفحة <em>(## لعنوان فرعي، - لنقطة، سطر فاضي لفقرة جديدة)</em></span>
          <textarea name="body" rows={16} defaultValue={s?.body} />
        </label>
        <div className="adm-grid">
          <label className="adm-field">
            <span>عنوان قوقل <em>(اختياري، 60 حرف تقريباً)</em></span>
            <input name="seo_title" maxLength={70} defaultValue={s?.seo_title ?? ""} />
          </label>
          <label className="adm-field">
            <span>وصف قوقل <em>(اختياري، 150 حرف تقريباً)</em></span>
            <input name="seo_description" maxLength={200} defaultValue={s?.seo_description ?? ""} />
          </label>
        </div>
        <div className="adm-row">
          <button className="adm-btn adm-btn--red" type="submit" name="intent" value="publish">حفظ ونشر</button>
          <button className="adm-btn" type="submit" name="intent" value="draft">حفظ كمسودة</button>
          <span className="adm-muted">المسودة ما تظهر للزوار. المعاينة تفتح لك فقط وأنت مسجل دخول.</span>
        </div>
      </form>
      {s && (
        <form className="adm-card adm-row" action={deleteContent}>
          <input type="hidden" name="kind" value="service" />
          <input type="hidden" name="id" value={s.id} />
          <label className="adm-check">
            <input type="checkbox" required /> متأكد من الحذف
          </label>
          <button className="adm-btn adm-btn--danger" type="submit">حذف الخدمة</button>
        </form>
      )}
    </>
  );
}
