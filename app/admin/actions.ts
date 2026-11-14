"use server";

import { redirect } from "next/navigation";
import {
  CONTENT_ROLES,
  REQUEST_ROLES,
  allow,
  audit,
  clientKey,
  createSession,
  destroySession,
  getSession,
  requireUser,
  sessionTokenHash,
  type Role,
} from "@/lib/auth";
import type { MediaItem } from "@/lib/content";
import { decrypt, fingerprint, hashPassword, randomToken, verifyPassword, verifyTotp } from "@/lib/crypto";
import { sql } from "@/lib/db";
import { notifyRequest } from "@/lib/notify";
import { statusLabels, statusesFor, type ContactIntent } from "@/lib/site";
import { removeUpload, saveUpload } from "@/lib/uploads";

// Every action re-checks the session and role on the server; hiding a button in the page is never the protection.

const str = (f: FormData, key: string, max = 300) => String(f.get(key) ?? "").trim().slice(0, max);
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
function to(path: string, params: Record<string, string> = {}): never {
  // Messages travel in the URL, so they are signed: a crafted link cannot make the dashboard show its own text.
  const msg = params.ok ?? params.error;
  const q = new URLSearchParams(msg ? { ...params, sig: fingerprint(msg) } : params).toString();
  redirect(q ? `${path}?${q}` : path);
}
const UUID = /^[0-9a-f-]{36}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_PASSWORD = 12;

/* ───────── Sign-in ───────── */

let dummyHash: Promise<string> | undefined;

export async function login(f: FormData) {
  const email = str(f, "email", 120).toLowerCase();
  const password = str(f, "password", 200);
  const fail = () => to("/admin/login", { error: "الإيميل أو كلمة المرور غير صحيحة، أو الحساب مقفل مؤقتاً." });
  if (!(await allow(`login:${await clientKey()}`, 10, 600))) to("/admin/login", { error: "محاولات كثيرة. جرّب بعد عشر دقايق." });

  const [user] = await sql<{ id: string; name: string; password_hash: string; locked: boolean; failed_logins: number }[]>`
    select id, name, password_hash, failed_logins, coalesce(locked_until > now(), false) as locked
    from users where email = ${email} and active`;
  // Always spend the same time hashing, so a missing account can't be told apart from a wrong password.
  const ok = await verifyPassword(password, user?.password_hash ?? (await (dummyHash ??= hashPassword(randomToken()))));
  if (!user || user.locked) fail();
  if (!ok) {
    const lock = user.failed_logins + 1 >= 5;
    await sql`update users set failed_logins = ${lock ? 0 : user.failed_logins + 1},
              locked_until = ${lock ? sql`now() + interval '15 minutes'` : null} where id = ${user.id}`;
    await audit(user, lock ? "login.locked" : "login.failed", "user", user.id);
    fail();
  }
  await sql`update users set failed_logins = 0, locked_until = null where id = ${user.id}`;
  await createSession(user.id); // password only: opens nothing until the second step passes
  to("/admin/mfa");
}

export async function logout() {
  await destroySession();
  to("/admin/login");
}

export async function verifyMfa(f: FormData) {
  const user = await getSession();
  if (!user) to("/admin/login");
  const me = user!;
  if (!(await allow(`mfa:${me.id}`, 6, 300))) to("/admin/mfa", { error: "محاولات كثيرة. انتظر خمس دقايق." });
  const [row] = await sql<{ totp_secret: string | null; totp_last_step: string }[]>`
    select totp_secret, totp_last_step from users where id = ${me.id}`;
  const step = row.totp_secret ? verifyTotp(decrypt(row.totp_secret), str(f, "code", 12), Number(row.totp_last_step)) : null;
  if (!step) {
    await audit(me, "mfa.failed", "user", me.id);
    to("/admin/mfa", { error: "الرمز غير صحيح أو منتهي. جرّب الرمز الجديد من التطبيق." });
  }
  // Each code works once. Then swap the half-open session for a fresh, fully signed-in one.
  await sql`update users set totp_enabled = true, totp_last_step = ${step} where id = ${me.id}`;
  await destroySession();
  await createSession(me.id);
  await sql`update sessions set mfa_ok = true where token_hash = ${await sessionTokenHash()}`;
  await audit(me, me.totp_enabled ? "login.success" : "mfa.enabled", "user", me.id);
  to("/admin");
}

/* ───────── My account ───────── */

export async function changePassword(f: FormData) {
  const me = await requireUser();
  const next = str(f, "next", 200);
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${me.id}`;
  if (!(await allow(`pw:${me.id}`, 5, 600)) || !(await verifyPassword(str(f, "current", 200), row.password_hash))) {
    to("/admin/account", { error: "كلمة المرور الحالية غير صحيحة." });
  }
  if (next.length < MIN_PASSWORD) to("/admin/account", { error: `كلمة المرور الجديدة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  await sql`update users set password_hash = ${await hashPassword(next)} where id = ${me.id}`;
  await sql`delete from sessions where user_id = ${me.id} and token_hash <> ${await sessionTokenHash()}`;
  await audit(me, "password.changed", "user", me.id);
  to("/admin/account", { ok: "تم تغيير كلمة المرور، وسجّلنا خروج الأجهزة الثانية." });
}

/* ───────── Requests (owner, agent) ───────── */

export async function updateRequest(f: FormData) {
  const me = await requireUser(...REQUEST_ROLES);
  const id = str(f, "id");
  if (!UUID.test(id)) to("/admin/requests");
  const [r] = await sql<{ type: ContactIntent; status: string; assignee_id: string | null }[]>`
    select type, status, assignee_id from requests where id = ${id}`;
  if (!r) to("/admin/requests");
  const path = `/admin/requests/${id}`;

  const status = str(f, "status");
  if (status && status !== r.status) {
    if (!statusesFor(r.type).includes(status)) to(path, { error: "الحالة غير مناسبة لنوع الطلب." });
    await sql`update requests set status = ${status}, updated_at = now(),
              closed_at = ${status === "closed" ? sql`now()` : null} where id = ${id}`;
    await audit(me, "request.status", "request", id, { from: statusLabels[r.status], to: statusLabels[status] });
  }

  if (f.has("assignee")) {
    const assignee = str(f, "assignee") || null;
    if (assignee !== r.assignee_id) {
      const [u] = assignee
        ? await sql<{ name: string }[]>`select name from users where id = ${assignee} and active and role in ('owner', 'agent')`
        : [{ name: "بدون مسؤول" }];
      if (!u) to(path, { error: "الموظف غير موجود أو ما عنده صلاحية الطلبات." });
      await sql`update requests set assignee_id = ${assignee}, updated_at = now() where id = ${id}`;
      await audit(me, "request.assigned", "request", id, { to: u.name });
    }
  }

  const note = str(f, "note", 2000);
  if (note) {
    await sql`insert into request_notes (request_id, author_id, body) values (${id}, ${me.id}, ${note})`;
    await sql`update requests set updated_at = now() where id = ${id}`;
    await audit(me, "request.note", "request", id);
  }
  to(path, { ok: "تم الحفظ." });
}

export async function retryNotify(f: FormData) {
  await requireUser(...REQUEST_ROLES);
  const id = str(f, "id");
  if (!UUID.test(id)) to("/admin/requests");
  await notifyRequest(id);
  const [r] = await sql<{ notify_status: string }[]>`select notify_status from requests where id = ${id}`;
  to(`/admin/requests/${id}`, r?.notify_status === "sent" ? { ok: "تم إرسال التنبيه." } : { error: "فشل إرسال التنبيه مرة ثانية. راجع إعدادات البريد." });
}

export async function deleteRequest(f: FormData) {
  const me = await requireUser("owner");
  const id = str(f, "id");
  if (!UUID.test(id)) to("/admin/requests");
  const [r] = await sql<{ ref: string }[]>`delete from requests where id = ${id} returning ref`;
  // The log keeps the reference only, not the customer's details.
  if (r) await audit(me, "request.deleted", "request", id, { ref: r.ref });
  to("/admin/requests", { ok: "تم حذف الطلب وبياناته." });
}

/* ───────── Content (owner, editor) ───────── */

const publishState = (f: FormData) => (str(f, "intent") === "publish" ? "published" : "draft");

export async function saveService(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = str(f, "id");
  const path = `/admin/services/${id || "new"}`;
  const row = {
    slug: str(f, "slug", 60).toLowerCase(),
    code: str(f, "code", 20).toUpperCase() || "SERVICE",
    title: str(f, "title", 120),
    line: str(f, "line", 200),
    items: lines(str(f, "items", 2000)),
    summary: str(f, "summary", 600),
    body: str(f, "body", 12000),
    seo_title: str(f, "seo_title", 70) || null,
    seo_description: str(f, "seo_description", 200) || null,
    position: Number(str(f, "position")) || 0,
    status: publishState(f),
  };
  if (!row.title || !row.line) to(path, { error: "العنوان والجملة التعريفية مطلوبة." });
  if (!SLUG.test(row.slug)) to(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: social-media" });
  const [taken] = await sql`select 1 from services where slug = ${row.slug} and id::text <> ${id}`;
  if (taken) to(path, { error: "هذا الرابط مستخدم لخدمة ثانية." });
  const [saved] = id
    ? await sql<{ id: string }[]>`update services set ${sql(row)}, updated_at = now() where id = ${id} returning id`
    : await sql<{ id: string }[]>`insert into services ${sql(row)} returning id`;
  if (!saved) to("/admin/services");
  await audit(me, row.status === "published" ? "service.published" : "service.saved_draft", "service", saved.id, { title: row.title });
  to(`/admin/services/${saved.id}`, { ok: row.status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة (غير ظاهرة للزوار)." });
}

export async function saveWork(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = str(f, "id");
  const path = `/admin/works/${id || "new"}`;
  const row = {
    slug: str(f, "slug", 60).toLowerCase(),
    title: str(f, "title", 120),
    category: str(f, "category", 60),
    client: str(f, "client", 100) || null,
    summary: str(f, "summary", 400),
    body: str(f, "body", 8000),
    service_slug: str(f, "service_slug", 60) || null,
    position: Number(str(f, "position")) || 0,
    status: publishState(f),
  };
  if (!row.title) to(path, { error: "عنوان العمل مطلوب." });
  if (!SLUG.test(row.slug)) to(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: eid-night" });
  const [taken] = await sql`select 1 from works where slug = ${row.slug} and id::text <> ${id}`;
  if (taken) to(path, { error: "هذا الرابط مستخدم لعمل ثاني." });

  // Media: keep what stays (in the order shown), drop what was ticked for removal, then add the new uploads.
  const [existing] = id ? await sql<{ media: MediaItem[] }[]>`select media from works where id = ${id}` : [{ media: [] as MediaItem[] }];
  if (!existing) to("/admin/works");
  const remove = new Set(f.getAll("remove").map(String));
  const alts = new Map(existing.media.map((m, i) => [m.src, str(f, `alt-${i}`, 200)]));
  const media: MediaItem[] = existing.media.filter((m) => !remove.has(m.src)).map((m) => ({ ...m, alt: alts.get(m.src) || m.alt }));
  const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length > 12) to(path, { error: "ارفع 12 ملف كحد أقصى في المرة الوحدة." });
  try {
    for (const file of files) media.push(await saveUpload(file, me.id, str(f, "video_shape") !== "wide"));
  } catch (e) {
    to(path, { error: e instanceof Error ? e.message : "تعذر رفع الملف." });
  }
  const firstSrc = str(f, "first", 300);
  media.sort((a, b) => Number(b.src === firstSrc) - Number(a.src === firstSrc));
  // Cover: the first image, or the first video's poster.
  const cover = media.find((m) => m.type === "image")?.src ?? media.find((m) => m.poster)?.poster ?? null;
  for (const m of media) if (m.type === "video" && !m.poster && cover) m.poster = cover;

  const full = { ...row, cover, media: sql.json(media) as never };
  const [saved] = id
    ? await sql<{ id: string }[]>`update works set ${sql(full)}, updated_at = now() where id = ${id} returning id`
    : await sql<{ id: string }[]>`insert into works ${sql(full)} returning id`;
  for (const src of remove) if (existing.media.some((m) => m.src === src)) await removeUpload(src);
  await audit(me, row.status === "published" ? "work.published" : "work.saved_draft", "work", saved.id, { title: row.title });
  to(`/admin/works/${saved.id}`, { ok: row.status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة (غير ظاهرة للزوار)." });
}

export async function saveFaq(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = str(f, "id");
  const row = {
    question: str(f, "question", 200),
    answer: str(f, "answer", 2000),
    position: Number(str(f, "position")) || 0,
    status: publishState(f),
  };
  if (!row.question || !row.answer) to("/admin/faqs", { error: "السؤال والجواب مطلوبين." });
  const [saved] = id
    ? await sql<{ id: string }[]>`update faqs set ${sql(row)}, updated_at = now() where id = ${id} returning id`
    : await sql<{ id: string }[]>`insert into faqs ${sql(row)} returning id`;
  if (saved) await audit(me, row.status === "published" ? "faq.published" : "faq.saved_draft", "faq", saved.id, { question: row.question });
  to("/admin/faqs", { ok: row.status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة." });
}

const TABLES = { service: "services", work: "works", faq: "faqs" } as const;

export async function deleteContent(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const kind = str(f, "kind") as keyof typeof TABLES;
  const id = str(f, "id");
  const table = TABLES[kind];
  if (!table || !UUID.test(id)) to("/admin");
  if (kind === "work") {
    const [w] = await sql<{ media: MediaItem[] }[]>`select media from works where id = ${id}`;
    for (const m of w?.media ?? []) await removeUpload(m.src);
  }
  await sql`delete from ${sql(table)} where id = ${id}`;
  await audit(me, `${kind}.deleted`, kind, id);
  to(`/admin/${table}`, { ok: "تم الحذف." });
}

export async function saveLinks(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const links = {
    whatsapp: str(f, "whatsapp", 20).replace(/\D/g, ""),
    instagram: str(f, "instagram", 60).replace(/^@/, ""),
    tiktok: str(f, "tiktok", 60).replace(/^@/, ""),
    email: str(f, "email", 120),
  };
  if (!/^\d{10,15}$/.test(links.whatsapp)) to("/admin/settings", { error: "رقم الواتساب لازم يكون بالصيغة الدولية بدون +، مثل 9665XXXXXXXX" });
  if (!/^[\w.]+$/.test(links.instagram) || !/^[\w.]+$/.test(links.tiktok)) to("/admin/settings", { error: "اكتب اسم الحساب فقط بدون رابط." });
  if (!/^\S+@\S+\.\S+$/.test(links.email)) to("/admin/settings", { error: "الإيميل غير صحيح." });
  await sql`insert into settings (key, value) values ('links', ${sql.json(links)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await audit(me, "settings.links", "settings", "links");
  to("/admin/settings", { ok: "تم تحديث روابط التواصل." });
}

/* ───────── Owner only ───────── */

export async function saveSystem(f: FormData) {
  const me = await requireUser("owner");
  const email = str(f, "notify_email", 120);
  const days = Number(str(f, "retention_days"));
  if (!/^\S+@\S+\.\S+$/.test(email)) to("/admin/settings", { error: "بريد التنبيهات غير صحيح." });
  if (!Number.isInteger(days) || days < 0 || days > 3650) to("/admin/settings", { error: "مدة الاحتفاظ لازم تكون رقم بين 0 و 3650 يوم." });
  for (const [key, value] of [["notify_email", email], ["retention_days", days]] as const) {
    await sql`insert into settings (key, value) values (${key}, ${sql.json(value)})
              on conflict (key) do update set value = excluded.value, updated_at = now()`;
  }
  await audit(me, "settings.system", "settings", "system", { retention_days: days });
  to("/admin/settings", { ok: "تم حفظ إعدادات النظام." });
}

const ROLES: Role[] = ["owner", "agent", "editor"];

export async function createUser(f: FormData) {
  const me = await requireUser("owner");
  const email = str(f, "email", 120).toLowerCase();
  const name = str(f, "name", 80);
  const role = str(f, "role") as Role;
  const password = str(f, "password", 200);
  if (!/^\S+@\S+\.\S+$/.test(email) || !name || !ROLES.includes(role)) to("/admin/users", { error: "عبّ الاسم والإيميل والدور." });
  if (password.length < MIN_PASSWORD) to("/admin/users", { error: `كلمة المرور المؤقتة لازم ${MIN_PASSWORD} حرف أو أكثر.` });
  const [u] = await sql<{ id: string }[]>`
    insert into users (email, name, role, password_hash) values (${email}, ${name}, ${role}, ${await hashPassword(password)})
    on conflict (email) do nothing returning id`;
  if (!u) to("/admin/users", { error: "هذا الإيميل مسجل من قبل." });
  await audit(me, "user.created", "user", u.id, { email, role });
  to("/admin/users", { ok: "تم إنشاء الحساب. أعطه كلمة المرور المؤقتة، وبيطلب منه النظام تفعيل التحقق بخطوتين عند أول دخول." });
}

export async function updateUser(f: FormData) {
  const me = await requireUser("owner");
  const id = str(f, "id");
  const op = str(f, "op");
  if (!UUID.test(id)) to("/admin/users");
  const [u] = await sql<{ role: Role; active: boolean; email: string }[]>`select role, active, email from users where id = ${id}`;
  if (!u) to("/admin/users");
  // The owner can't lock themselves out or drop their own role; another owner has to do it.
  if (id === me.id && op !== "password") to("/admin/users", { error: "ما تقدر تعدّل صلاحيات حسابك بنفسك." });

  if (op === "role") {
    const role = str(f, "role") as Role;
    if (!ROLES.includes(role)) to("/admin/users");
    await sql`update users set role = ${role} where id = ${id}`;
    await sql`delete from sessions where user_id = ${id}`;
    await audit(me, "user.role", "user", id, { email: u.email, from: u.role, to: role });
  } else if (op === "toggle") {
    await sql`update users set active = not active where id = ${id}`;
    await sql`delete from sessions where user_id = ${id}`;
    await audit(me, u.active ? "user.disabled" : "user.enabled", "user", id, { email: u.email });
  } else if (op === "mfa") {
    await sql`update users set totp_secret = null, totp_enabled = false, totp_last_step = 0 where id = ${id}`;
    await sql`delete from sessions where user_id = ${id}`;
    await audit(me, "user.mfa_reset", "user", id, { email: u.email });
  } else if (op === "password") {
    const password = str(f, "password", 200);
    if (password.length < MIN_PASSWORD) to("/admin/users", { error: `كلمة المرور لازم ${MIN_PASSWORD} حرف أو أكثر.` });
    await sql`update users set password_hash = ${await hashPassword(password)}, failed_logins = 0, locked_until = null where id = ${id}`;
    if (id !== me.id) await sql`delete from sessions where user_id = ${id}`;
    await audit(me, "user.password_reset", "user", id, { email: u.email });
  }
  to("/admin/users", { ok: "تم التحديث." });
}
