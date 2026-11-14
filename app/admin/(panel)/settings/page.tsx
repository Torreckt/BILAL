import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES, OWNER_ROLES } from "@/lib/roles";
import { getLinks, getSetting } from "@/lib/content";
import { env } from "@/lib/env";
import { saveLinks, saveSystem } from "../../actions/settings";
import { Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function Settings({ searchParams }: { searchParams: Search }) {
  const user = await requireUser(...CONTENT_ROLES);
  const [links, notify, days] = await Promise.all([getLinks(), getSetting("notify_email", env.notifyEmail), getSetting("retention_days", 365)]);
  return (
    <>
      <h1 className="adm-title">الإعدادات</h1>
      <Flash sp={await searchParams} />
      <form className="adm-card adm-stack" action={saveLinks}>
        <h2>روابط التواصل</h2>
        <div className="adm-grid">
          <label className="adm-field">
            <span>رقم الواتساب <em>(دولي بدون +)</em></span>
            <input name="whatsapp" required dir="ltr" inputMode="numeric" defaultValue={links.whatsapp} />
          </label>
          <label className="adm-field">
            <span>الإيميل الظاهر في الموقع</span>
            <input name="email" type="email" required dir="ltr" defaultValue={links.email} />
          </label>
          <label className="adm-field">
            <span>حساب إنستغرام</span>
            <input name="instagram" required dir="ltr" defaultValue={links.instagram} />
          </label>
          <label className="adm-field">
            <span>حساب تيك توك</span>
            <input name="tiktok" required dir="ltr" defaultValue={links.tiktok} />
          </label>
        </div>
        <button className="adm-btn adm-btn--red" type="submit">حفظ الروابط</button>
      </form>

      {OWNER_ROLES.includes(user.role) && (
        <form className="adm-card adm-stack" action={saveSystem}>
          <h2>إعدادات النظام</h2>
          <div className="adm-grid">
            <label className="adm-field">
              <span>بريد استقبال تنبيهات الطلبات</span>
              <input name="notify_email" type="email" required dir="ltr" defaultValue={notify} />
            </label>
            <label className="adm-field">
              <span>حذف الطلبات المغلقة بعد (يوم) <em>(0 = بدون حذف تلقائي)</em></span>
              <input name="retention_days" type="number" min={0} max={3650} required defaultValue={days} />
            </label>
          </div>
          <p className="adm-muted">
            حالة البريد على السيرفر: {env.smtp.host && env.smtp.from ? "مضبوط" : "غير مضبوط (الطلبات تنحفظ، والتنبيهات تظهر «فشلت» لين تضبط SMTP)"}
          </p>
          <button className="adm-btn adm-btn--red" type="submit">حفظ</button>
        </form>
      )}
    </>
  );
}
