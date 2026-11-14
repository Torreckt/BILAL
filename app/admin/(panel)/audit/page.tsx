import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { OWNER_ROLES } from "@/lib/roles";
import { AUDIT_ACTION_LABELS, isAuditAction, recentAudit } from "@/lib/audit";
import { formatDateTime } from "../../ui";

export const metadata: Metadata = { title: "سجل التغييرات" };


export default async function Audit() {
  await requireUser(...OWNER_ROLES);
  const rows = await recentAudit(300);
  return (
    <>
      <h1 className="adm-title">سجل التغييرات</h1>
      <p className="adm-muted">آخر 300 عملية: الدخول، الصلاحيات، الطلبات، والمحتوى.</p>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>تفاصيل</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="الوقت"><time>{formatDateTime(r.created_at)}</time></td>
                <td data-label="المستخدم">{r.actor_name ?? "النظام"}</td>
                <td data-label="العملية">{(isAuditAction(r.action) ? AUDIT_ACTION_LABELS[r.action] : r.action)}</td>
                <td data-label="تفاصيل" className="adm-muted">
                  {Object.values(r.meta).filter((v) => typeof v === "string" || typeof v === "number").join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
