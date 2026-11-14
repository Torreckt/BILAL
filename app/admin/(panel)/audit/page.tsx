import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { when } from "../../ui";

export const metadata: Metadata = { title: "سجل التغييرات" };

const labels: Record<string, string> = {
  "login.success": "دخول ناجح", "login.failed": "محاولة دخول فاشلة", "login.locked": "قفل الحساب بعد محاولات فاشلة",
  "mfa.enabled": "فعّل التحقق بخطوتين", "mfa.failed": "رمز تحقق خاطئ", "password.changed": "غيّر كلمة المرور",
  "request.status": "غيّر حالة طلب", "request.assigned": "أسند طلب", "request.note": "أضاف ملاحظة على طلب", "request.deleted": "حذف طلب",
  "requests.purged": "حذف تلقائي لطلبات مغلقة قديمة",
  "service.published": "نشر خدمة", "service.saved_draft": "حفظ خدمة كمسودة", "service.deleted": "حذف خدمة",
  "work.published": "نشر عمل", "work.saved_draft": "حفظ عمل كمسودة", "work.deleted": "حذف عمل",
  "faq.published": "نشر سؤال", "faq.saved_draft": "حفظ سؤال كمسودة", "faq.deleted": "حذف سؤال",
  "settings.links": "عدّل روابط التواصل", "settings.system": "عدّل إعدادات النظام",
  "user.created": "أنشأ مستخدم", "user.role": "غيّر دور مستخدم", "user.disabled": "أوقف حساب", "user.enabled": "فعّل حساب",
  "user.mfa_reset": "صفّر التحقق بخطوتين لمستخدم", "user.password_reset": "غيّر كلمة مرور مستخدم", "user.created_or_reset": "إنشاء أو تصفير حساب من السيرفر",
};

export default async function Audit() {
  await requireUser("owner");
  const rows = await sql<{ id: string; actor_name: string | null; action: string; meta: Record<string, unknown>; created_at: Date }[]>`
    select id, actor_name, action, meta, created_at from audit_log order by created_at desc limit 300`;
  return (
    <>
      <h1 className="adm-title">سجل التغييرات</h1>
      <p className="adm-muted">آخر 300 عملية: الدخول، الصلاحيات، الطلبات، والمحتوى.</p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>تفاصيل</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="الوقت"><time>{when(r.created_at)}</time></td>
                <td data-label="المستخدم">{r.actor_name ?? "النظام"}</td>
                <td data-label="العملية">{labels[r.action] ?? r.action}</td>
                <td data-label="تفاصيل" className="adm-muted">
                  {Object.values(r.meta).filter((v) => typeof v === "string" || typeof v === "number").join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
