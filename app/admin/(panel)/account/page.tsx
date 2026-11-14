import type { Metadata } from "next";
import { requireUser, roleLabels } from "@/lib/auth";
import { changePassword } from "../../actions";
import { Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "حسابي" };

export default async function Account({ searchParams }: { searchParams: Search }) {
  const user = await requireUser();
  return (
    <>
      <h1 className="adm-title">حسابي</h1>
      <Flash sp={await searchParams} />
      <section className="adm-card">
        <dl className="adm-facts">
          <div><dt>الاسم</dt><dd>{user.name}</dd></div>
          <div><dt>الإيميل</dt><dd dir="ltr">{user.email}</dd></div>
          <div><dt>الدور</dt><dd>{roleLabels[user.role]}</dd></div>
          <div><dt>التحقق بخطوتين</dt><dd>مفعّل. إذا غيّرت جوالك اطلب من المالك يصفّره لك.</dd></div>
        </dl>
      </section>
      <form className="adm-card adm-stack" action={changePassword}>
        <h2>تغيير كلمة المرور</h2>
        <label className="adm-field">
          <span>كلمة المرور الحالية</span>
          <input name="current" type="password" required autoComplete="current-password" dir="ltr" />
        </label>
        <label className="adm-field">
          <span>كلمة المرور الجديدة <em>(12 حرف أو أكثر)</em></span>
          <input name="next" type="password" required minLength={12} autoComplete="new-password" dir="ltr" />
        </label>
        <button className="adm-btn adm-btn--red" type="submit">غيّر كلمة المرور</button>
      </form>
    </>
  );
}
