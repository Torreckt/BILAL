import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES } from "@/lib/roles";
import { getFaqs, type Faq } from "@/lib/content";
import { deleteContent, saveFaq } from "../../actions/content";
import { PublishedBadge, Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "الأسئلة الشائعة" };

function FaqForm({ faq }: { faq?: Faq }) {
  return (
    <form className="adm-stack" action={saveFaq}>
      <input type="hidden" name="id" value={faq?.id ?? ""} />
      <label className="adm-field">
        <span>السؤال</span>
        <input name="question" required maxLength={200} defaultValue={faq?.question} />
      </label>
      <label className="adm-field">
        <span>الجواب</span>
        <textarea name="answer" required rows={3} maxLength={2000} defaultValue={faq?.answer} />
      </label>
      <div className="adm-row">
        <label className="adm-field adm-field--small">
          <span>الترتيب</span>
          <input name="position" type="number" defaultValue={faq?.position ?? 0} />
        </label>
        <button className="adm-btn adm-btn--red" type="submit" name="intent" value="publish">حفظ ونشر</button>
        <button className="adm-btn" type="submit" name="intent" value="draft">حفظ كمسودة</button>
      </div>
    </form>
  );
}

export default async function Faqs({ searchParams }: { searchParams: Search }) {
  await requireUser(...CONTENT_ROLES);
  const rows = await getFaqs(true);
  return (
    <>
      <div className="adm-head">
        <h1 className="adm-title">الأسئلة الشائعة</h1>
        <a className="adm-btn" href="/?preview=1#faq" target="_blank" rel="noopener">معاينة</a>
      </div>
      <Flash sp={await searchParams} />
      <details className="adm-card">
        <summary>أضف سؤال جديد</summary>
        <FaqForm />
      </details>
      {rows.map((f) => (
        <details key={f.id} className="adm-card">
          <summary>
            {f.question} <PublishedBadge status={f.status} />
          </summary>
          <FaqForm faq={f} />
          <form className="adm-row" action={deleteContent}>
            <input type="hidden" name="kind" value="faq" />
            <input type="hidden" name="id" value={f.id} />
            <label className="adm-check">
              <input type="checkbox" required /> متأكد
            </label>
            <button className="adm-btn adm-btn--danger" type="submit">حذف السؤال</button>
          </form>
        </details>
      ))}
    </>
  );
}
