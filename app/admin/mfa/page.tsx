import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { enrollmentQr } from "@/lib/mfa";
import { logout, verifyMfa } from "../actions/auth";
import { Flash, type Search } from "../ui";

export const metadata: Metadata = { title: "التحقق بخطوتين" };

export default async function Mfa({ searchParams }: { searchParams: Search }) {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (user.mfa_ok) redirect("/admin");
  const enroll = user.totp_enabled ? null : await enrollmentQr(user.id, user.email);
  return (
    <main className="adm-gate">
      <div className="adm-card adm-gate__card">
        <h1 className="adm-title">{enroll ? "فعّل التحقق بخطوتين" : "رمز التحقق"}</h1>
        <Flash sp={await searchParams} />
        {enroll && (
          <>
            <p>
              حسابات الإدارة لازم لها تحقق بخطوتين. افتح تطبيق مصادقة (مثل Google Authenticator أو Microsoft Authenticator) وامسح
              الرمز:
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="adm-qr" src={enroll.qr} width={220} height={220} alt="رمز QR لإضافة الحساب في تطبيق المصادقة" />
            <p className="adm-muted">
              أو أدخل المفتاح يدوياً: <code dir="ltr">{enroll.secret}</code>
            </p>
          </>
        )}
        <form action={verifyMfa} className="adm-stack">
          <label className="adm-field">
            <span>الرمز المكوّن من 6 أرقام</span>
            <input name="code" inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} required autoComplete="one-time-code" dir="ltr" autoFocus className="adm-code" />
          </label>
          <button className="adm-btn adm-btn--red" type="submit">
            تأكيد
          </button>
        </form>
        <form action={logout}>
          <button className="adm-link" type="submit">
            خروج
          </button>
        </form>
      </div>
    </main>
  );
}
