"use server";

import { ROLES, getUser, insertUser, resetTotp, setPasswordHash, setRole, toggleActive } from "@/lib/admin/users";
import { audit } from "@/lib/audit";
import { endSessions, requireUser, type Role } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { MIN_PASSWORD, isEmailLike, isUuid } from "@/lib/validate";
import { field, redirectWithMessage } from "./form";

// Account management: owner only.

export async function createUser(f: FormData) {
  const me = await requireUser("owner");
  const email = field(f, "email", 120).toLowerCase();
  const name = field(f, "name", 80);
  const role = field(f, "role") as Role;
  const password = field(f, "password", 200);
  if (!isEmailLike(email) || !name || !ROLES.includes(role)) redirectWithMessage("/admin/users", { error: "عبّ الاسم والإيميل والدور." });
  if (password.length < MIN_PASSWORD) redirectWithMessage("/admin/users", { error: `كلمة المرور المؤقتة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  const id = await insertUser(email, name, role, await hashPassword(password));
  if (!id) redirectWithMessage("/admin/users", { error: "هذا الإيميل مسجل من قبل." });
  await audit(me, "user.created", "user", id, { email, role });
  redirectWithMessage("/admin/users", { ok: "تم إنشاء الحساب. أعطه كلمة المرور المؤقتة، وبيطلب منه النظام تفعيل التحقق بخطوتين عند أول دخول." });
}

export async function updateUser(f: FormData) {
  const me = await requireUser("owner");
  const id = field(f, "id");
  const op = field(f, "op");
  if (!isUuid(id)) redirectWithMessage("/admin/users");
  const u = await getUser(id);
  if (!u) redirectWithMessage("/admin/users");
  // The owner can't lock themselves out or drop their own role; another owner has to do it.
  if (id === me.id && op !== "password") redirectWithMessage("/admin/users", { error: "ما تقدر تعدّل صلاحيات حسابك بنفسك." });

  if (op === "role") {
    const role = field(f, "role") as Role;
    if (!ROLES.includes(role)) redirectWithMessage("/admin/users");
    await setRole(id, role);
    await endSessions(id);
    await audit(me, "user.role", "user", id, { email: u.email, from: u.role, to: role });
  } else if (op === "toggle") {
    await toggleActive(id);
    await endSessions(id);
    await audit(me, u.active ? "user.disabled" : "user.enabled", "user", id, { email: u.email });
  } else if (op === "mfa") {
    await resetTotp(id);
    await endSessions(id);
    await audit(me, "user.mfa_reset", "user", id, { email: u.email });
  } else if (op === "password") {
    const password = field(f, "password", 200);
    if (password.length < MIN_PASSWORD) redirectWithMessage("/admin/users", { error: `كلمة المرور لازم ${MIN_PASSWORD} حرف أو أكثر.` });
    await setPasswordHash(id, await hashPassword(password));
    if (id !== me.id) await endSessions(id);
    await audit(me, "user.password_reset", "user", id, { email: u.email });
  }
  redirectWithMessage("/admin/users", { ok: "تم التحديث." });
}
