import { sql } from "./db";

/** Every action the dashboard and scripts write to the audit log, with the owner-facing label. */
export const AUDIT_ACTION_LABELS = {
  "login.success": "دخول ناجح",
  "login.failed": "محاولة دخول فاشلة",
  "login.locked": "قفل الحساب بعد محاولات فاشلة",
  "password.changed": "غيّر كلمة المرور",
  "request.status": "غيّر حالة طلب",
  "request.assigned": "أسند طلب",
  "request.note": "أضاف ملاحظة على طلب",
  "request.deleted": "حذف طلب",
  "request.notify_retried": "أعاد إرسال تنبيه طلب",
  "requests.purged": "حذف تلقائي لطلبات مغلقة قديمة",
  "service.published": "نشر خدمة",
  "service.saved_draft": "حفظ خدمة كمسودة",
  "service.deleted": "حذف خدمة",
  "work.published": "نشر عمل",
  "work.saved_draft": "حفظ عمل كمسودة",
  "work.deleted": "حذف عمل",
  "faq.published": "نشر سؤال",
  "faq.saved_draft": "حفظ سؤال كمسودة",
  "faq.deleted": "حذف سؤال",
  "settings.links": "عدّل روابط التواصل",
  "settings.system": "عدّل إعدادات النظام",
  "user.created": "أنشأ مستخدم",
  "user.role": "غيّر دور مستخدم",
  "user.disabled": "أوقف حساب",
  "user.enabled": "فعّل حساب",
  "user.password_reset": "غيّر كلمة مرور مستخدم",
  "user.created_or_reset": "إنشاء أو تصفير حساب من السيرفر",
} as const;
export type AuditAction = keyof typeof AUDIT_ACTION_LABELS;
export const isAuditAction = (v: string): v is AuditAction => Object.hasOwn(AUDIT_ACTION_LABELS, v);

/** Small JSON details stored with an entry (never customer contact details). */
export type AuditMeta = Record<string, string | number | boolean | null>;
/** A stored entry. `action` is a plain string: rows written by older versions may hold names no longer in the table. */
export type AuditEntry = { id: string; actor_name: string | null; action: string; meta: AuditMeta; created_at: Date };

export async function recordAudit(
  actor: { id: string; name: string } | null,
  action: AuditAction,
  entity: string,
  entityId: string | null,
  meta: AuditMeta = {},
) {
  await sql`insert into audit_log (actor_id, actor_name, action, entity, entity_id, meta)
            values (${actor?.id ?? null}, ${actor?.name ?? null}, ${action}, ${entity}, ${entityId}, ${sql.json(meta)})`;
}

export const recentAudit = (limit: number) =>
  sql<AuditEntry[]>`select id, actor_name, action, meta, created_at from audit_log order by created_at desc limit ${limit}`;

export const auditFor = (entity: string, entityId: string) =>
  sql<AuditEntry[]>`select id, actor_name, action, meta, created_at from audit_log
                    where entity = ${entity} and entity_id = ${entityId} order by created_at desc`;
