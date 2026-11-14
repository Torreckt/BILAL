"use server";

import { saveSetting } from "@/lib/admin/content";
import { audit } from "@/lib/audit";
import { CONTENT_ROLES, requireUser } from "@/lib/auth";
import { isEmailLike } from "@/lib/validate";
import { field, redirectWithMessage } from "./form";

/** Contact links shown on the site: owner and editor. */
export async function saveLinks(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const links = {
    whatsapp: field(f, "whatsapp", 20).replace(/\D/g, ""),
    instagram: field(f, "instagram", 60).replace(/^@/, ""),
    tiktok: field(f, "tiktok", 60).replace(/^@/, ""),
    email: field(f, "email", 120),
  };
  if (!/^\d{10,15}$/.test(links.whatsapp)) redirectWithMessage("/admin/settings", { error: "رقم الواتساب لازم يكون بالصيغة الدولية بدون +، مثل 9665XXXXXXXX" });
  if (!/^[\w.]+$/.test(links.instagram) || !/^[\w.]+$/.test(links.tiktok)) redirectWithMessage("/admin/settings", { error: "اكتب اسم الحساب فقط بدون رابط." });
  if (!isEmailLike(links.email)) redirectWithMessage("/admin/settings", { error: "الإيميل غير صحيح." });
  await saveSetting("links", links);
  await audit(me, "settings.links", "settings", "links");
  redirectWithMessage("/admin/settings", { ok: "تم تحديث روابط التواصل." });
}

/** Notification email and data retention: owner only. */
export async function saveSystem(f: FormData) {
  const me = await requireUser("owner");
  const email = field(f, "notify_email", 120);
  const days = Number(field(f, "retention_days"));
  if (!isEmailLike(email)) redirectWithMessage("/admin/settings", { error: "بريد التنبيهات غير صحيح." });
  if (!Number.isInteger(days) || days < 0 || days > 3650) redirectWithMessage("/admin/settings", { error: "مدة الاحتفاظ لازم تكون رقم بين 0 و 3650 يوم." });
  await saveSetting("notify_email", email);
  await saveSetting("retention_days", days);
  await audit(me, "settings.system", "settings", "system", { retention_days: days });
  redirectWithMessage("/admin/settings", { ok: "تم حفظ إعدادات النظام." });
}
