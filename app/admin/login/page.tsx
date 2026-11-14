import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Eye } from "@/components/Eye";
import { getSession } from "@/lib/auth";
import { login } from "../actions";
import { Flash, type Search } from "../ui";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function Login({ searchParams }: { searchParams: Search }) {
  const user = await getSession();
  if (user) redirect("/admin");
  return (
    <main className="adm-gate">
      <form className="adm-card adm-gate__card" action={login}>
        <p className="adm-brand">
          <Eye className="adm-brand__eye" />
          <span dir="ltr">Mainstream</span>
        </p>
        <h1 className="adm-title">لوحة الإدارة</h1>
        <Flash sp={await searchParams} />
        <label className="adm-field">
          <span>اسم المستخدم</span>
          <input name="username" required maxLength={60} autoComplete="username" autoCapitalize="none" dir="ltr" autoFocus />
        </label>
        <label className="adm-field">
          <span>كلمة المرور</span>
          <input name="password" type="password" required autoComplete="current-password" dir="ltr" />
        </label>
        <button className="adm-btn adm-btn--red" type="submit">
          دخول
        </button>
        <p className="adm-muted">الدخول للموظفين فقط. إذا نسيت بياناتك اطلبها من مدير الحساب.</p>
      </form>
    </main>
  );
}
