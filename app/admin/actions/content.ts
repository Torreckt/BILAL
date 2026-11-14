"use server";

import {
  CONTENT_TABLES,
  SlugTakenError,
  type ContentRow,
  asJsonb,
  deleteContentRow,
  saveContentRow,
  isContentKind,
  slugTaken,
  workMedia,
} from "@/lib/admin/content";
import { reconcileWorkMedia } from "@/lib/admin/work-media";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { CONTENT_ROLES } from "@/lib/roles";
import type { MediaItem } from "@/lib/content";
import { removeUpload, saveUpload } from "@/lib/uploads";
import { isSlug, isUuid } from "@/lib/validate";
import { field, fieldLines, publishState, redirectWithMessage } from "./form";

// Site content: owner and editor. Every action re-checks the role on the server.

const savedMessage = (status: string) => (status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة (غير ظاهرة للزوار).");

/** Saves the row, turning a concurrent duplicate slug into the same friendly error as the pre-check. */
async function saveWithSlug(table: "services" | "works", id: string | undefined, row: ContentRow, path: string, takenMessage: string) {
  try {
    return await saveContentRow(table, id, row);
  } catch (e) {
    if (e instanceof SlugTakenError) redirectWithMessage(path, { error: takenMessage });
    throw e;
  }
}

export async function saveService(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = field(f, "id");
  const path = `/admin/services/${id || "new"}`;
  if (id && !isUuid(id)) redirectWithMessage("/admin/services");
  const row = {
    slug: field(f, "slug", 60).toLowerCase(),
    code: field(f, "code", 20).toUpperCase() || "SERVICE",
    title: field(f, "title", 120),
    line: field(f, "line", 200),
    items: fieldLines(f, "items", 2000),
    summary: field(f, "summary", 600),
    body: field(f, "body", 12000),
    seo_title: field(f, "seo_title", 70) || null,
    seo_description: field(f, "seo_description", 200) || null,
    position: Number(field(f, "position")) || 0,
    status: publishState(f),
  };
  const taken = "هذا الرابط مستخدم لخدمة ثانية.";
  if (!row.title || !row.line) redirectWithMessage(path, { error: "العنوان والجملة التعريفية مطلوبة." });
  if (!isSlug(row.slug)) redirectWithMessage(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: social-media" });
  if (await slugTaken("services", row.slug, id || undefined)) redirectWithMessage(path, { error: taken });
  const savedId = await saveWithSlug("services", id || undefined, row, path, taken);
  if (!savedId) redirectWithMessage("/admin/services");
  await audit(me, row.status === "published" ? "service.published" : "service.saved_draft", "service", savedId, { title: row.title });
  redirectWithMessage(`/admin/services/${savedId}`, { ok: savedMessage(row.status) });
}

const rollback = async (items: MediaItem[]) => {
  for (const item of items) await removeUpload(item.src).catch((e) => console.error("upload rollback failed", item.src, e));
};

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
async function storeUploads(files: File[], userId: string, portraitVideo: boolean) {
  const stored: MediaItem[] = [];
  try {
    for (const file of files) stored.push(await saveUpload(file, userId, portraitVideo));
    return stored;
  } catch (e) {
    await rollback(stored);
    throw e;
  }
}

export async function saveWork(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = field(f, "id");
  const path = `/admin/works/${id || "new"}`;
  if (id && !isUuid(id)) redirectWithMessage("/admin/works");
  const row = {
    slug: field(f, "slug", 60).toLowerCase(),
    title: field(f, "title", 120),
    category: field(f, "category", 60),
    client: field(f, "client", 100) || null,
    summary: field(f, "summary", 400),
    body: field(f, "body", 8000),
    service_slug: field(f, "service_slug", 60) || null,
    position: Number(field(f, "position")) || 0,
    status: publishState(f),
  };
  const taken = "هذا الرابط مستخدم لعمل ثاني.";
  if (!row.title) redirectWithMessage(path, { error: "عنوان العمل مطلوب." });
  if (!isSlug(row.slug)) redirectWithMessage(path, { error: "الرابط لازم يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: eid-night" });
  if (await slugTaken("works", row.slug, id || undefined)) redirectWithMessage(path, { error: taken });

  const existing = id ? await workMedia(id) : [];
  if (!existing) redirectWithMessage("/admin/works");
  const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length > 12) redirectWithMessage(path, { error: "ارفع 12 ملف كحد أقصى في المرة الوحدة." });
  let uploaded: MediaItem[] = [];
  try {
    uploaded = await storeUploads(files, me.id, field(f, "video_shape") !== "wide");
  } catch (e) {
    redirectWithMessage(path, { error: e instanceof Error ? e.message : "تعذر رفع الملف." });
  }
  const { media, cover, removed } = reconcileWorkMedia({
    existing,
    remove: f.getAll("remove").map(String),
    altFor: (i) => field(f, `alt-${i}`, 200),
    uploaded,
    firstSrc: field(f, "first", 300),
  });

  const savedId = await keepUploadsOnlyIfSaved(uploaded, () =>
    saveWithSlug("works", id || undefined, { ...row, cover, media: asJsonb(media) }, path, taken),
  );
  if (!savedId) redirectWithMessage("/admin/works");
  for (const src of removed) await removeUpload(src);
  await audit(me, row.status === "published" ? "work.published" : "work.saved_draft", "work", savedId, { title: row.title });
  redirectWithMessage(`/admin/works/${savedId}`, { ok: savedMessage(row.status) });
}

export async function saveFaq(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const id = field(f, "id");
  if (id && !isUuid(id)) redirectWithMessage("/admin/faqs");
  const row = {
    question: field(f, "question", 200),
    answer: field(f, "answer", 2000),
    position: Number(field(f, "position")) || 0,
    status: publishState(f),
  };
  if (!row.question || !row.answer) redirectWithMessage("/admin/faqs", { error: "السؤال والجواب مطلوبين." });
  const savedId = await saveContentRow("faqs", id || undefined, row);
  if (savedId) await audit(me, row.status === "published" ? "faq.published" : "faq.saved_draft", "faq", savedId, { question: row.question });
  redirectWithMessage("/admin/faqs", { ok: row.status === "published" ? "تم الحفظ والنشر." : "تم الحفظ كمسودة." });
}

export async function deleteContent(f: FormData) {
  const me = await requireUser(...CONTENT_ROLES);
  const kind = field(f, "kind");
  const id = field(f, "id");
  if (!isContentKind(kind) || !isUuid(id)) redirectWithMessage("/admin");
  const table = CONTENT_TABLES[kind];
  if (kind === "work") for (const m of (await workMedia(id)) ?? []) await removeUpload(m.src);
  await deleteContentRow(table, id);
  await audit(me, `${kind}.deleted`, kind, id);
  redirectWithMessage(`/admin/${table}`, { ok: "تم الحذف." });
}
