import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { roleLabels, type Role, OWNER_ROLES, ROLES } from "@/lib/roles";
import { listUsers } from "@/lib/admin/users";
import { createUser, updateUser } from "../../actions/users";
import { Badge, Flash, type Search } from "../../ui";

export const metadata: Metadata = { title: "المستخدمون" };

const roleHelp: Record<Role, string> = {
  owner: "كل شي: الطلبات، المحتوى، المستخدمين، الإعدادات، وحذف الطلبات.",
  agent: "الطلبات فقط: يشوفها، يغيّر حالتها، يسندها، ويكتب ملاحظات. ما يعدّل المحتوى.",
  editor: "المحتوى فقط: الخدمات، الأعمال، الأسئلة، وروابط التواصل. ما يشوف بيانات العملاء.",
};

export default async function Users({ searchParams }: { searchParams: Search }) {
  const me = await requireUser(...OWNER_ROLES);
  const users = await listUsers();
  return (
    <>
      <h1 className="adm-title">المستخدمون والصلاحيات</h1>
      <Flash sp={await searchParams} />
      <section className="adm-card">
        <h2>الأدوار</h2>
        <dl className="adm-facts">
          {ROLES.map((r) => (
            <div key={r}>
              <dt>{roleLabels[r]}</dt>
              <dd>{roleHelp[r]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {users.map((u) => (
        <section key={u.id} className="adm-card adm-stack">
          <h2>
            {u.name} <Badge>{roleLabels[u.role]}</Badge> {!u.active && <Badge tone="red">موقوف</Badge>}
          </h2>
          <p className="adm-muted">
            اسم المستخدم: <span dir="ltr">{u.username}</span>
          </p>
          {u.id === me.id ? (
            <p className="adm-muted">هذا حسابك. غيّر كلمة المرور من صفحة «حسابي».</p>
          ) : (
            <div className="adm-row">
              <form className="adm-row" action={updateUser}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="op" value="role" />
                <select name="role" defaultValue={u.role} aria-label="الدور">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabels[r]}</option>
                  ))}
                </select>
                <button className="adm-btn" type="submit">غيّر الدور</button>
              </form>
              <form action={updateUser}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="op" value="active" />
                <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                <button className="adm-btn" type="submit">{u.active ? "أوقف الحساب" : "فعّل الحساب"}</button>
              </form>
              <form className="adm-row" action={updateUser}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="op" value="password" />
                <input name="password" type="password" minLength={12} required placeholder="كلمة مرور جديدة" autoComplete="new-password" aria-label="كلمة مرور جديدة" dir="ltr" />
                <button className="adm-btn" type="submit">غيّر كلمة المرور</button>
              </form>
            </div>
          )}
        </section>
      ))}

      <form className="adm-card adm-stack" action={createUser}>
        <h2>أضف مستخدم</h2>
        <p className="adm-muted">ما فيه تسجيل عام. أنت تنشئ اسم المستخدم وكلمة المرور لكل موظف وتعطيه إياها.</p>
        <div className="adm-grid">
          <label className="adm-field">
            <span>الاسم</span>
            <input name="name" required maxLength={80} />
          </label>
          <label className="adm-field">
            <span>اسم المستخدم <em>(إنجليزي، مثل ahmed)</em></span>
            <input name="username" required minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9._\-]{2,39}" dir="ltr" autoComplete="off" autoCapitalize="none" />
          </label>
          <label className="adm-field">
            <span>الدور</span>
            <select name="role" defaultValue="agent">
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </select>
          </label>
          <label className="adm-field">
            <span>كلمة المرور <em>(12 حرف أو أكثر)</em></span>
            <input name="password" type="password" required minLength={12} dir="ltr" autoComplete="new-password" />
          </label>
        </div>
        <button className="adm-btn adm-btn--red" type="submit">أنشئ الحساب</button>
      </form>
    </>
  );
}
