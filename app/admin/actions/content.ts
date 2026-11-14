"use server";

import {
  CONTENT_TABLES,
  SlugTakenError,
  type FaqFields,
  type ServiceFields,
  type WorkFields,
  asJsonb,
  deleteContentRow,
  saveContentRow,
  isContentKind,
  slugTaken,
  workMedia,
} from "@/lib/admin/content";
import { reconcileWorkMedia } from "@/lib/admin/work-media";
import { recordAudit, type AuditMeta } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES } from "@/lib/roles";
import type { MediaItem, PublishStatus } from "@/lib/content";
import { removeUploads, saveUpload } from "@/lib/uploads";
import { isSlug, isUuid } from "@/lib/validate";
import { formField, formFieldLines, publishState, redirectWithMessage } from "./form";

// Site content: owner and editor. Every action re-checks the role on the server.

const savedMessage = (status: PublishStatus) => (status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة (غير ظاهرة للزوار).");

/** The id an editor form posted: undefined for a new row; anything else must be a UUID. */
function postedId(f: FormData, listPath: string) {
  const id = formField(f, "id");
  if (id && !isUuid(id)) redirectWithMessage(listPath);
  return id || undefined;
}

const serviceFromForm = (f: FormData): ServiceFields => ({
  slug: formField(f, "slug", 60).toLowerCase(),
  code: formField(f, "code", 20).toUpperCase() || "SERVICE",
  title: formField(f, "title", 120),
  line: formField(f, "line", 200),
  items: formFieldLines(f, "items", 2000),
  summary: formField(f, "summary", 600),
  body: formField(f, "body", 12000),
  seo_title: formField(f, "seo_title", 70) || null,
  seo_description: formField(f, "seo_description", 200) || null,
  position: Number(formField(f, "position")) || 0,
  status: publishState(f),
});

const workFromForm = (f: FormData): WorkFields => ({
  slug: formField(f, "slug", 60).toLowerCase(),
  title: formField(f, "title", 120),
  category: formField(f, "category", 60),
  client: formField(f, "client", 100) || null,
  summary: formField(f, "summary", 400),
  body: formField(f, "body", 8000),
  service_slug: formField(f, "service_slug", 60) || null,
  position: Number(formField(f, "position")) || 0,
  status: publishState(f),
});

const faqFromForm = (f: FormData): FaqFields => ({
  question: formField(f, "question", 200),
  answer: formField(f, "answer", 2000),
  position: Number(formField(f, "position")) || 0,
  status: publishState(f),
});

/** Saves the row, turning a concurrent duplicate slug into the same friendly error as the pre-check. */
async function saveWithSlug<T extends "services" | "works">(table: T, id: string | undefined, row: Parameters<typeof saveContentRow<T>>[2], path: string, takenMessage: string) {
  try {
    return await saveContentRow(table, id, row);
  } catch (e) {
    if (e instanceof SlugTakenError) redirectWithMessage(path, { error: takenMessage });
    throw e;
  }
}

/** The common end of every content save: back to the list if nothing was saved, otherwise audit and show the result. */
async function finishSave(
  me: { id: string; name: string },
  save: { kind: "service" | "work" | "faq"; id: string | undefined; status: PublishStatus; meta: AuditMeta },
  paths: { list: string; next: (id: string) => string },
): Promise<never> {
  if (!save.id) redirectWithMessage(paths.list);
  const action = save.status === "published" ? (`${save.kind}.published` as const) : (`${save.kind}.saved_draft` as const);
  await recordAudit(me, action, save.kind, save.id, save.meta);
  redirectWithMessage(paths.next(save.id), { ok: savedMessage(save.status) });
}

export async function saveService(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = postedId(f, "/admin/services");
  const path = `/admin/services/${id ?? "new"}`;
  const row = serviceFromForm(f);
  const taken = "هذا الرابط مستخدم لخدمة ثانية.";
  if (!row.title || !row.line) redirectWithMessage(path, { error: "العنوان والجملة التعريفية مطلوبة." });
  if (!isSlug(row.slug)) redirectWithMessage(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: social-media" });
  if (await slugTaken("services", row.slug, id)) redirectWithMessage(path, { error: taken });
  const savedId = await saveWithSlug("services", id, row, path, taken);
  await finishSave(me, { kind: "service", id: savedId, status: row.status, meta: { title: row.title } }, { list: "/admin/services", next: (s) => `/admin/services/${s}` });
}

const rollback = (items: MediaItem[]) => removeUploads(items.map((m) => m.src));

/** Runs `save`; if it doesn't produce a saved id (or throws), the files uploaded for it are removed again. */
async function keepUploadsOnlyIfSaved<T>(uploaded: MediaItem[], save: () => Promise<T | undefined>) {
  let saved: T | undefined;
  try {
    saved = await save();
    return saved;
  } finally {
    if (!saved) await rollback(uploaded);
  }
}

/** Stores each new file; if one fails, the ones already stored in this request are removed again. */
async function storeUploads(files: File[], options: { userId: string; videoShape: "portrait" | "wide" }) {
  const stored: MediaItem[] = [];
  try {
    for (const file of files) stored.push(await saveUpload(file, options));
    return stored;
  } catch (e) {
    await rollback(stored);
    throw e;
  }
}

export async function saveWork(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = postedId(f, "/admin/works");
  const path = `/admin/works/${id ?? "new"}`;
  const row = workFromForm(f);
  const taken = "هذا الرابط مستخدم لعمل ثاني.";
  if (!row.title) redirectWithMessage(path, { error: "عنوان العمل مطلوب." });
  if (!isSlug(row.slug)) redirectWithMessage(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: eid-night" });
  if (await slugTaken("works", row.slug, id)) redirectWithMessage(path, { error: taken });

  const existing = id ? await workMedia(id) : [];
  if (!existing) redirectWithMessage("/admin/works");
  const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length > 12) redirectWithMessage(path, { error: "ارفع 12 ملف كحد أقصى في المرة الوحدة." });
  let uploaded: MediaItem[] = [];
  try {
    uploaded = await storeUploads(files, { userId: me.id, videoShape: formField(f, "video_shape") === "wide" ? "wide" : "portrait" });
  } catch (e) {
    redirectWithMessage(path, { error: e instanceof Error ? e.message : "تعذر رفع الملف." });
  }
  const { media, cover, removed } = reconcileWorkMedia({
    existing,
    remove: f.getAll("remove").map(String),
    altFor: (i) => formField(f, `alt-${i}`, 200),
    uploaded,
    firstSrc: formField(f, "first", 300),
  });

  const savedId = await keepUploadsOnlyIfSaved(uploaded, () => saveWithSlug("works", id, { ...row, cover, media: asJsonb(media) }, path, taken));
  if (savedId) await removeUploads(removed);
  await finishSave(me, { kind: "work", id: savedId, status: row.status, meta: { title: row.title } }, { list: "/admin/works", next: (s) => `/admin/works/${s}` });
}

export async function saveFaq(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = postedId(f, "/admin/faqs");
  const row = faqFromForm(f);
  if (!row.question || !row.answer) redirectWithMessage("/admin/faqs", { error: "السؤال والجواب مطلوبين." });
  const savedId = await saveContentRow("faqs", id, row);
  await finishSave(me, { kind: "faq", id: savedId, status: row.status, meta: { question: row.question } }, { list: "/admin/faqs", next: () => "/admin/faqs" });
}

export async function deleteContent(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const kind = formField(f, "kind");
  const id = formField(f, "id");
  if (!isContentKind(kind) || !isUuid(id)) redirectWithMessage("/admin");
  const table = CONTENT_TABLES[kind];
  // Delete the row first: if that fails, its files are still there. Files go only once nothing points at them.
  const media = kind === "work" ? ((await workMedia(id)) ?? []) : [];
  await deleteContentRow(table, id);
  await removeUploads(media.map((m) => m.src));
  await recordAudit(me, `${kind}.deleted`, kind, id);
  redirectWithMessage(`/admin/${table}`, { ok: "تم الحذف." });
}
