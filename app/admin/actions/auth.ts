"use server";

import { createSession, destroySession, endSessions, requireUser } from "@/lib/auth";
import { clearFailedLogins, findActiveUserByUsername, passwordHash, recordFailedLogin, setPasswordHash } from "@/lib/admin/users";
import { audit } from "@/lib/audit";
import { hashPassword, randomToken, verifyPassword } from "@/lib/crypto";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";
import { MIN_PASSWORD } from "@/lib/validate";
import { field, redirectWithMessage } from "./form";

// Every action re-checks the session and role on the server; hiding a button in the page is never the protection.

let dummyHash: Promise<string> | undefined;

export async function login(f: FormData) {
  const username = field(f, "username", 60).toLowerCase();
  const password = field(f, "password", 200);
  const fail: () => never = () => redirectWithMessage("/admin/login", { error: "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب مقفل مؤقتاً." });
  if (!(await consumeRateLimit(`login:${await clientKey()}`, { limit: 10, windowSeconds: 600 }))) {
    redirectWithMessage("/admin/login", { error: "محاولات كثيرة. جرّب بعد عشر دقايق." });
  }

  const user = await findActiveUserByUsername(username);
  // Always spend the same time hashing, so a missing account can't be told apart from a wrong password.
  const ok = await verifyPassword(password, user?.password_hash ?? (await (dummyHash ??= hashPassword(randomToken()))));
  if (!user || user.locked) fail();
  if (!ok) {
    const locked = await recordFailedLogin(user.id);
    await audit(user, locked ? "login.locked" : "login.failed", "user", user.id);
    fail();
  }
  await clearFailedLogins(user.id);
  await createSession(user.id);
  await audit(user, "login.success", "user", user.id);
  redirectWithMessage("/admin");
}

export async function logout() {
  await destroySession();
  redirectWithMessage("/admin/login");
}

export async function changePassword(f: FormData) {
  const me = await requireUser();
  const next = field(f, "next", 200);
  const current = (await passwordHash(me.id)) ?? "";
  if (!(await consumeRateLimit(`pw:${me.id}`, { limit: 5, windowSeconds: 600 })) || !(await verifyPassword(field(f, "current", 200), current))) {
    redirectWithMessage("/admin/account", { error: "كلمة المرور الحالية غير صحيحة." });
  }
  if (next.length < MIN_PASSWORD) redirectWithMessage("/admin/account", { error: `كلمة المرور الجديدة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  await setPasswordHash(me.id, await hashPassword(next));
  await endSessions(me.id, { keepCurrent: true });
  await audit(me, "password.changed", "user", me.id);
  redirectWithMessage("/admin/account", { ok: "تم تغيير كلمة المرور، وسجّلنا خروج الأجهزة الثانية." });
}
