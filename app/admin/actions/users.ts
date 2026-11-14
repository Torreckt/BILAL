"use server";

import { getUser, insertUser, setActive, setPasswordHash, setRole } from "@/lib/admin/users";
import { recordAudit } from "@/lib/audit";
import { endSessions, requireUser } from "@/lib/auth";
import { OWNER_ROLES, isRole } from "@/lib/roles";
import { hashPassword } from "@/lib/crypto";
import { MIN_PASSWORD, isUsername, isUuid } from "@/lib/validate";
import { formField, redirectWithMessage } from "./form";

// Account management: owner only.

export async function createUser(f: FormData) {
  const me = await requireUser(...OWNER_ROLES);
  const username = formField(f, "username", 60).toLowerCase();
  const name = formField(f, "name", 80);
  const role = formField(f, "role");
  const password = formField(f, "password", 200);
  if (!name || !isRole(role)) redirectWithMessage("/admin/users", { error: "عبّ الاسم واسم المستخدم والدور." });
  if (!isUsername(username)) {
    redirectWithMessage("/admin/users", { error: "اسم المستخدم: حروف إنجليزية صغيرة وأرقام فقط (ويُسمح بـ . _ -)، من 3 إلى 40 حرف." });
  }
  if (password.length < MIN_PASSWORD) redirectWithMessage("/admin/users", { error: `كلمة المرور المؤقتة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  const id = await insertUser({ username, name, role, passwordHash: await hashPassword(password) });
  if (!id) redirectWithMessage("/admin/users", { error: "اسم المستخدم هذا مستخدم من قبل." });
  await recordAudit(me, "user.created", "user", id, { username, role });
  redirectWithMessage("/admin/users", { ok: "تم إنشاء الحساب. أعط الموظف اسم المستخدم وكلمة المرور، ويقدر يغيّرها من «حسابي»." });
}

export async function updateUser(f: FormData) {
  const me = await requireUser(...OWNER_ROLES);
  const id = formField(f, "id");
  const op = formField(f, "op");
  if (!isUuid(id)) redirectWithMessage("/admin/users");
  const u = await getUser(id);
  if (!u) redirectWithMessage("/admin/users");
  // The owner can't lock themselves out or drop their own role; another owner has to do it.
  if (id === me.id && op !== "password") redirectWithMessage("/admin/users", { error: "ما تقدر تعدّل صلاحيات حسابك بنفسك." });

  if (op === "role") {
    const role = formField(f, "role");
    if (!isRole(role)) redirectWithMessage("/admin/users");
    await setRole(id, role);
    await endSessions(id);
    await recordAudit(me, "user.role", "user", id, { username: u.username, from: u.role, to: role });
  } else if (op === "active") {
    const active = formField(f, "active") === "1";
    await setActive(id, active);
    await endSessions(id);
    await recordAudit(me, active ? "user.enabled" : "user.disabled", "user", id, { username: u.username });
  } else if (op === "password") {
    const password = formField(f, "password", 200);
    if (password.length < MIN_PASSWORD) redirectWithMessage("/admin/users", { error: `كلمة المرور لازم ${MIN_PASSWORD} حرف أو أكثر.` });
    await setPasswordHash(id, await hashPassword(password));
    if (id !== me.id) await endSessions(id);
    await recordAudit(me, "user.password_reset", "user", id, { username: u.username });
  } else {
    redirectWithMessage("/admin/users", { error: "عملية غير معروفة." });
  }
  redirectWithMessage("/admin/users", { ok: "تم التحديث." });
}
