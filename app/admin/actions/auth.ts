"use server";

import { createSession, destroySession, endSessions, getSession, markSessionMfaOk, requireUser } from "@/lib/auth";
import {
  acceptTotpStep,
  clearFailedLogins,
  findActiveUserByEmail,
  passwordHash,
  recordFailedLogin,
  setPasswordHash,
  totpState,
} from "@/lib/admin/users";
import { audit } from "@/lib/audit";
import { decrypt, hashPassword, randomToken, verifyPassword, verifyTotp } from "@/lib/crypto";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";
import { MIN_PASSWORD } from "@/lib/validate";
import { field, redirectWithMessage } from "./form";

// Every action re-checks the session and role on the server; hiding a button in the page is never the protection.

let dummyHash: Promise<string> | undefined;

export async function login(f: FormData) {
  const email = field(f, "email", 120).toLowerCase();
  const password = field(f, "password", 200);
  const fail = () => redirectWithMessage("/admin/login", { error: "الإيميل أو كلمة المرور غير صحيحة، أو الحساب مقفل مؤقتاً." });
  if (!(await consumeRateLimit(`login:${await clientKey()}`, 10, 600))) {
    redirectWithMessage("/admin/login", { error: "محاولات كثيرة. جرّب بعد عشر دقايق." });
  }

  const user = await findActiveUserByEmail(email);
  // Always spend the same time hashing, so a missing account can't be told apart from a wrong password.
  const ok = await verifyPassword(password, user?.password_hash ?? (await (dummyHash ??= hashPassword(randomToken()))));
  if (!user || user.locked) fail();
  if (!ok) {
    const locked = await recordFailedLogin(user);
    await audit(user, locked ? "login.locked" : "login.failed", "user", user.id);
    fail();
  }
  await clearFailedLogins(user.id);
  await createSession(user.id); // password only: opens nothing until the second step passes
  redirectWithMessage("/admin/mfa");
}

export async function logout() {
  await destroySession();
  redirectWithMessage("/admin/login");
}

export async function verifyMfa(f: FormData) {
  const me = await getSession();
  if (!me) redirectWithMessage("/admin/login");
  if (!(await consumeRateLimit(`mfa:${me.id}`, 6, 300))) redirectWithMessage("/admin/mfa", { error: "محاولات كثيرة. انتظر خمس دقايق." });
  const totp = await totpState(me.id);
  const step = totp.secret ? verifyTotp(decrypt(totp.secret), field(f, "code", 12), totp.lastStep) : null;
  if (!step) {
    await audit(me, "mfa.failed", "user", me.id);
    redirectWithMessage("/admin/mfa", { error: "الرمز غير صحيح أو منتهي. جرّب الرمز الجديد من التطبيق." });
  }
  // Each code works once. Then swap the half-open session for a fresh, fully signed-in one.
  await acceptTotpStep(me.id, step);
  await destroySession();
  await createSession(me.id);
  await markSessionMfaOk();
  await audit(me, me.totp_enabled ? "login.success" : "mfa.enabled", "user", me.id);
  redirectWithMessage("/admin");
}

export async function changePassword(f: FormData) {
  const me = await requireUser();
  const next = field(f, "next", 200);
  const current = await passwordHash(me.id);
  if (!(await consumeRateLimit(`pw:${me.id}`, 5, 600)) || !(await verifyPassword(field(f, "current", 200), current))) {
    redirectWithMessage("/admin/account", { error: "كلمة المرور الحالية غير صحيحة." });
  }
  if (next.length < MIN_PASSWORD) redirectWithMessage("/admin/account", { error: `كلمة المرور الجديدة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  await setPasswordHash(me.id, await hashPassword(next));
  await endSessions(me.id, { keepCurrent: true });
  await audit(me, "password.changed", "user", me.id);
  redirectWithMessage("/admin/account", { ok: "تم تغيير كلمة المرور، وسجّلنا خروج الأجهزة الثانية." });
}
