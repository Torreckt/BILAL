import nodemailer from "nodemailer";
import { sql } from "./db";
import { env } from "./env";
import { getSetting } from "./content";
import { formatDay, intentLabel } from "./site";
import type { RequestRow } from "./requests";

/** Emails the team about a saved request and records the outcome on the row. Never throws. */
export async function notifyRequest(id: string) {
  const [r] = await sql<RequestRow[]>`select * from requests where id = ${id}`;
  if (!r) return;
  let error: string | null = null;
  try {
    const { host, port, user, pass, from } = env.smtp;
    if (!host || !from) throw new Error("إعدادات البريد (SMTP) غير مضبوطة على السيرفر");
    const to = await getSetting("notify_email", env.notifyEmail);
    const rows: [string, string | null][] = [
      ["النوع", intentLabel(r.type)],
      ["الاسم", r.name],
      ["الجوال", r.phone],
      ["الإيميل", r.email],
      ["النشاط / الجهة", r.business],
      ["نوع النشاط", r.sector],
      ["الخدمات", r.services.join("، ") || null],
      ["نوع الاجتماع", r.meeting_type],
      ["اليوم المفضل", r.meeting_day && formatDay(String(r.meeting_day).slice(0, 10))],
      ["الفترة", r.meeting_time],
      ["الموضوع", r.subject],
      ["التفاصيل", r.message],
    ];
    const text = [
      `طلب جديد من الموقع — ${r.ref}`,
      "",
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      "",
      `افتح الطلب: ${env.siteUrl}/admin/requests/${r.id}`,
    ].join("\n");
    await nodemailer
      .createTransport({ host, port, secure: port === 465, auth: user ? { user, pass } : undefined, connectionTimeout: 10000, socketTimeout: 15000 })
      .sendMail({ from, to, subject: `طلب جديد ${r.ref} — ${intentLabel(r.type)}`, text });
  } catch (e) {
    error = e instanceof Error ? e.message.slice(0, 300) : "خطأ غير معروف";
    // Log the failure without any customer details.
    console.error(JSON.stringify({ level: "error", event: "notify_failed", ref: r.ref, error }));
  }
  await sql`update requests set notify_status = ${error ? "failed" : "sent"}, notify_error = ${error},
            notify_attempts = notify_attempts + 1 where id = ${id}`;
}
