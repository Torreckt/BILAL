import type { Metadata } from "next";
import Image from "next/image";
import { CONTENT_ROLES, requireUser } from "@/lib/auth";
import { getWorkById } from "@/lib/admin/content";
import { getServices } from "@/lib/content";
import { loadEditable } from "../../../editable";
import { deleteContent, saveWork } from "../../../actions/content";
import { PublishedBadge, Flash, type Search } from "../../../ui";

export const metadata: Metadata = { title: "تعديل عمل" };

export default async function EditWork({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  await requireUser(...CONTENT_ROLES);
  const w = await loadEditable((await params).id, getWorkById);
  const services = await getServices(true);
  return (
    <>
      <p className="adm-crumb">
        <a href="/admin/works">الأعمال</a> / {w?.title ?? "عمل جديد"}
      </p>
      <div className="adm-head">
        <h1 className="adm-title">
          {w?.title ?? "عمل جديد"}{" "}
          {w && <PublishedBadge status={w.status} />}
        </h1>
        {w && (
          <a className="adm-btn" href={`/work/${w.slug}?preview=1`} target="_blank" rel="noopener">
            معاينة
          </a>
        )}
      </div>
      <Flash sp={await searchParams} />
      <form className="adm-card adm-stack" action={saveWork}>
        <input type="hidden" name="id" value={w?.id ?? ""} />
        <div className="adm-grid">
          <label className="adm-field">
            <span>عنوان العمل</span>
            <input name="title" required maxLength={120} defaultValue={w?.title} />
          </label>
          <label className="adm-field">
            <span>الرابط <em>(إنجليزي، مثل eid-night)</em></span>
            <input name="slug" required maxLength={60} dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={w?.slug} />
          </label>
          <label className="adm-field">
            <span>التصنيف <em>(مثل: تصوير ومونتاج)</em></span>
            <input name="category" maxLength={60} defaultValue={w?.category} />
          </label>
          <label className="adm-field">
            <span>العميل <em>(اختياري)</em></span>
            <input name="client" maxLength={100} defaultValue={w?.client ?? ""} />
          </label>
          <label className="adm-field">
            <span>الخدمة المرتبطة</span>
            <select name="service_slug" defaultValue={w?.service_slug ?? ""}>
              <option value="">بدون</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>الترتيب</span>
            <input name="position" type="number" defaultValue={w?.position ?? 0} />
          </label>
        </div>
        <label className="adm-field">
          <span>وصف مختصر <em>(يظهر في الكرت)</em></span>
          <textarea name="summary" rows={2} maxLength={400} defaultValue={w?.summary} />
        </label>
        <label className="adm-field">
          <span>تفاصيل العمل <em>(## لعنوان فرعي، - لنقطة)</em></span>
          <textarea name="body" rows={8} defaultValue={w?.body} />
        </label>

        <fieldset className="adm-media">
          <legend>الصور والفيديوهات</legend>
          {w && w.media.length > 0 && (
            <ul>
              {w.media.map((m, i) => (
                <li key={m.src}>
                  <span className="adm-tiles__shot">
                    <Image src={m.type === "video" ? (m.poster ?? w.cover ?? "/icon.svg") : m.src} alt="" fill sizes="160px" />
                    {m.type === "video" && <span className="adm-media__tag">فيديو</span>}
                  </span>
                  <label className="adm-field">
                    <span>وصف للصورة <em>(لقارئ الشاشة وقوقل)</em></span>
                    <input name={`alt-${i}`} maxLength={200} defaultValue={m.alt ?? ""} />
                  </label>
                  <label className="adm-check">
                    <input type="radio" name="first" value={m.src} defaultChecked={i === 0} /> الأولى
                  </label>
                  <label className="adm-check">
                    <input type="checkbox" name="remove" value={m.src} /> احذف
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label className="adm-field">
            <span>ارفع ملفات جديدة <em>(صور حتى 12 ميقا، فيديو MP4 حتى 30 ميقا)</em></span>
            <input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4" />
          </label>
          <label className="adm-field">
            <span>شكل الفيديو المرفوع</span>
            <select name="video_shape" defaultValue="tall">
              <option value="tall">طولي (ريلز 9:16)</option>
              <option value="wide">عرضي (16:9)</option>
            </select>
          </label>
          <p className="adm-muted">الغلاف هو أول صورة. نحوّل الصور تلقائياً لصيغة خفيفة ونمسح بيانات الموقع والكاميرا منها.</p>
        </fieldset>

        <div className="adm-row">
          <button className="adm-btn adm-btn--red" type="submit" name="intent" value="publish">حفظ ونشر</button>
          <button className="adm-btn" type="submit" name="intent" value="draft">حفظ كمسودة</button>
        </div>
      </form>
      {w && (
        <form className="adm-card adm-row" action={deleteContent}>
          <input type="hidden" name="kind" value="work" />
          <input type="hidden" name="id" value={w.id} />
          <label className="adm-check">
            <input type="checkbox" required /> متأكد من الحذف
          </label>
          <button className="adm-btn adm-btn--danger" type="submit">حذف العمل وملفاته</button>
        </form>
      )}
    </>
  );
}
