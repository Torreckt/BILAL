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
import { audit } from "@/lib/audit";
import { REQUEST_ROLES, requireUser } from "@/lib/auth";
import { statusLabels, statusesFor } from "@/lib/intents";
import { notifyRequest } from "@/lib/notify";
import { isUuid } from "@/lib/validate";
import { field, redirectWithMessage } from "./form";

// Requests: owner and agent. Every action re-checks the role on the server.

export async function updateRequest(f: FormData) {
  const me = await requireUser(...REQUEST_ROLES);
  const id = field(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  const r = await requestWorkflowState(id);
  if (!r) redirectWithMessage("/admin/requests");
  const path = `/admin/requests/${id}`;

  const status = field(f, "status");
  if (status && status !== r.status) {
    if (!statusesFor(r.type).includes(status)) redirectWithMessage(path, { error: "الحالة غير مناسبة لنوع الطلب." });
    await setRequestStatus(id, status);
    await audit(me, "request.status", "request", id, { from: statusLabels[r.status], to: statusLabels[status] });
  }

  if (f.has("assignee")) {
    const assignee = field(f, "assignee") || null;
    if (assignee !== r.assignee_id) {
      const name = assignee ? await requestStaffName(assignee) : "بدون مسؤول";
      if (!name) redirectWithMessage(path, { error: "الموظف غير موجود أو ما عنده صلاحية الطلبات." });
      await assignRequest(id, assignee);
      await audit(me, "request.assigned", "request", id, { to: name });
    }
  }

  const note = field(f, "note", 2000);
  if (note) {
    await addRequestNote(id, me.id, note);
    await audit(me, "request.note", "request", id);
  }
  redirectWithMessage(path, { ok: "تم الحفظ." });
}

export async function retryNotify(f: FormData) {
  await requireUser(...REQUEST_ROLES);
  const id = field(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  await notifyRequest(id);
  redirectWithMessage(
    `/admin/requests/${id}`,
    (await requestNotifyStatus(id)) === "sent" ? { ok: "تم إرسال التنبيه." } : { error: "فشل إرسال التنبيه مرة ثانية. راجع إعدادات البريد." },
  );
}

export async function deleteRequest(f: FormData) {
  const me = await requireUser("owner");
  const id = field(f, "id");
  if (!isUuid(id)) redirectWithMessage("/admin/requests");
  const ref = await deleteRequestRow(id);
  // The log keeps the reference only, not the customer's details.
  if (ref) await audit(me, "request.deleted", "request", id, { ref });
  redirectWithMessage("/admin/requests", { ok: "تم حذف الطلب وبياناته." });
}
