"use server";

import {
  addRequestNote,
  assignRequest,
  deleteRequest as deleteRequestRow,
  requestNotifyStatus,
  requestWorkflowState,
  setRequestStatus,
} from "@/lib/admin/requests";
import { requestStaffName } from "@/lib/admin/users";
import { recordAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { REQUEST_ROLES, OWNER_ROLES } from "@/lib/roles";
import { isRequestStatus, statusLabels, statusesFor } from "@/lib/intents";
import { notifyRequest } from "@/lib/notify";
import { isUuid } from "@/lib/validate";
import { formField, redirectWithMessage } from "./form";

// Requests: owner and agent. Every action re-checks the role on the server.

export async function updateRequest(f: FormData) {
  const me = await requireUser(...REQUEST_ROLES);
  const id = formField(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  const r = await requestWorkflowState(id);
  if (!r) redirectWithMessage("/admin/requests");
  const path = `/admin/requests/${id}`;

  const status = formField(f, "status");
  if (status && status !== r.status) {
    if (!isRequestStatus(status) || !statusesFor(r.type).includes(status)) redirectWithMessage(path, { error: "الحالة غير مناسبة لنوع الطلب." });
    await setRequestStatus(id, status);
    await recordAudit(me, "request.status", "request", id, { from: statusLabels[r.status], to: statusLabels[status] });
  }

  if (f.has("assignee")) {
    const assignee = formField(f, "assignee") || null;
    if (assignee !== r.assignee_id) {
      const name = assignee ? await requestStaffName(assignee) : "بدون مسؤول";
      if (!name) redirectWithMessage(path, { error: "الموظف غير موجود أو ما عنده صلاحية الطلبات." });
      await assignRequest(id, assignee);
      await recordAudit(me, "request.assigned", "request", id, { to: name });
    }
  }

  const note = formField(f, "note", 2000);
  if (note) {
    await addRequestNote(id, me.id, note);
    await recordAudit(me, "request.note", "request", id);
  }
  redirectWithMessage(path, { ok: "تم الحفظ." });
}

export async function retryNotify(f: FormData) {
  const me = await requireUser(...REQUEST_ROLES);
  const id = formField(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  await notifyRequest(id);
  const sent = (await requestNotifyStatus(id)) === "sent";
  await recordAudit(me, "request.notify_retried", "request", id, { sent });
  redirectWithMessage(`/admin/requests/${id}`, sent ? { ok: "تم إرسال التنبيه." } : { error: "فشل إرسال التنبيه مرة ثانية. راجع إعدادات البريد." });
}

export async function deleteRequest(f: FormData) {
  const me = await requireUser(...OWNER_ROLES);
  const id = formField(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  const ref = await deleteRequestRow(id);
  // The log keeps the reference only, not the customer's details.
  if (ref) await recordAudit(me, "request.deleted", "request", id, { ref });
  redirectWithMessage("/admin/requests", { ok: "تم حذف الطلب وبياناته." });
}
