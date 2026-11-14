// Public intake: validates a request sent from the site's contact form and saves it. Dashboard queries live in lib/admin/requests.ts.
import { randomInt } from "node:crypto";
import { z } from "zod";
import { sql } from "./db";
import { riyadhToday } from "./dates";
import { meetingTimes, meetingTypes, type ContactIntent, type NotifyStatus, type RequestStatus } from "./intents";

const clean = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() : v), z.string().max(max, "النص أطول من المسموح"));
const optional = (max: number) => clean(max).optional().transform((v) => v || null);
const required = (max: number, msg: string, min = 2) => clean(max).pipe(z.string().min(min, msg));

// Saudi mobiles and international numbers: keep digits, allow one leading +.
const phone = optional(24).refine((v) => !v || /^\+?\d{8,15}$/.test(v.replace(/[\s\-()]/g, "")), "رقم الجوال غير صحيح").transform((v) => v && v.replace(/[\s\-()]/g, ""));
const email = optional(120).refine((v) => !v || z.email().safeParse(v).success, "الإيميل غير صحيح").transform((v) => v && v.toLowerCase());

const base = {
  idem: z.uuid(),
  name: required(80, "اكتب اسمك"),
  phone,
  email,
  business: optional(100),
  sector: optional(60),
  source: optional(200),
};

const schema = z
  .discriminatedUnion("type", [
    z.object({
      ...base,
      type: z.literal("meeting"),
      meetingType: z.enum(meetingTypes, "اختر نوع الاجتماع"),
      day: optional(10).refine(
        (v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= riyadhToday() && v <= riyadhToday(120)),
        "اختر يوم من اليوم وطالع",
      ),
      time: optional(20).refine((v) => !v || (meetingTimes as readonly string[]).includes(v), "اختر فترة من القائمة"),
      message: optional(2000),
    }),
    z.object({
      ...base,
      type: z.literal("quote"),
      services: z.array(z.string().max(60)).min(1, "اختر خدمة وحدة على الأقل").max(12),
      business: required(100, "اكتب اسم النشاط"),
      message: required(2000, "اوصف احتياجك بجملة أو جملتين", 10),
    }),
    z.object({
      ...base,
      type: z.literal("inquiry"),
      subject: optional(120),
      message: required(2000, "اكتب سؤالك", 5),
    }),
    z.object({
      ...base,
      type: z.literal("partner"),
      business: required(100, "اكتب اسم الجهة"),
      message: required(2000, "اوصف مقترح التعاون", 10),
    }),
  ])
  .refine((d) => d.phone || d.email, { path: ["phone"], message: "اكتب رقم جوالك أو إيميلك عشان نقدر نرد عليك" });

export type RequestInput = z.infer<typeof schema>;

/** Checks what the schema can't on its own: a quote may only name published services. Same result shape as parseRequest. */
export async function checkReferences(data: RequestInput): Promise<{ ok: true } | { ok: false; errors: FieldErrors }> {
  if (data.type !== "quote") return { ok: true };
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from services where status = 'published' and slug in ${sql(data.services)}`;
  return n === new Set(data.services).size ? { ok: true } : { ok: false, errors: { services: "اختر الخدمات من القائمة" } };
}
export type FieldErrors = Record<string, string>;

export function parseRequest(data: unknown): { ok: true; data: RequestInput } | { ok: false; errors: FieldErrors } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, data: r.data };
  const errors: FieldErrors = {};
  for (const issue of r.error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= field === "type" ? "اختر نوع الطلب" : issue.message;
  }
  return { ok: false, errors };
}

// Reference shown to the visitor: short, unambiguous letters, not guessable in sequence.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const newRef = () => `MS-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

export type RequestRow = {
  id: string;
  ref: string;
  type: ContactIntent;
  status: RequestStatus;
  name: string;
  phone: string | null;
  email: string | null;
  business: string | null;
  sector: string | null;
  services: string[];
  meeting_type: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  subject: string | null;
  message: string | null;
  source: string | null;
  assignee_id: string | null;
  notify_status: NotifyStatus;
  notify_error: string | null;
  notify_attempts: number;
  created_at: Date;
  updated_at: Date;
};

/** Saves the request once. A repeat with the same idempotency key returns the first row instead of a new one. */
export async function saveRequest(d: RequestInput, ipHash: string) {
  const row = {
    idem_key: d.idem,
    type: d.type,
    name: d.name,
    phone: d.phone,
    email: d.email,
    business: d.business,
    sector: d.sector,
    source: d.source,
    services: d.type === "quote" ? d.services : [],
    meeting_type: d.type === "meeting" ? d.meetingType : null,
    meeting_day: d.type === "meeting" ? d.day : null,
    meeting_time: d.type === "meeting" ? d.time : null,
    subject: d.type === "inquiry" ? d.subject : null,
    message: d.message,
    ip_hash: ipHash,
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    const [created] = await sql<{ id: string; ref: string }[]>`
      insert into requests ${sql({ ...row, ref: newRef() })}
      on conflict do nothing returning id, ref`;
    if (created) return { ...created, created: true };
    const [existing] = await sql<{ id: string; ref: string }[]>`select id, ref from requests where idem_key = ${d.idem}`;
    if (existing) return { ...existing, created: false };
    // Otherwise the random reference collided; try another.
  }
  throw new Error("could not allocate a request reference");
}
