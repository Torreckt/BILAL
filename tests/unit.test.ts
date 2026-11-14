// Fast checks that need no database or server. Usage: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { field, fieldLines, publishState, redirectWithMessage } from "../app/admin/actions/form";
import { JsonLd, breadcrumbs } from "../components/JsonLd";
import { fingerprint, hashPassword, verifyPassword } from "../lib/crypto";
import { riyadhToday } from "../lib/dates";
import { parseRequestFilters } from "../lib/admin/requests";
import { reconcileWorkMedia } from "../lib/admin/work-media";
import type { MediaItem } from "../lib/content";
import { intentLabel, isContactIntent, isRequestStatus, statusesFor } from "../lib/intents";
import { isRole } from "../lib/roles";
import { parseRequest } from "../lib/requests";
import { isEmailLike, isIsoDate, isSlug, isUuid } from "../lib/validate";

const idem = "3f2b8c1e-5d4a-4b6f-9e21-0a1b2c3d4e5f";

test("passwords verify only against their own hash", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.ok(await verifyPassword("correct horse battery", hash));
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
});

test("each request type requires its own fields", () => {
  const base = { idem, name: "سارة", phone: "0501234567" };
  assert.ok(parseRequest({ ...base, type: "meeting", meetingType: "اجتماع أونلاين" }).ok);
  assert.ok(parseRequest({ ...base, type: "quote", services: ["web"], business: "كوفي", message: "نحتاج موقع تعريفي" }).ok);
  assert.ok(parseRequest({ ...base, type: "inquiry", subject: "سؤال", message: "كم المدة؟" }).ok);
  assert.ok(parseRequest({ ...base, type: "partner", business: "جهة", message: "مقترح تعاون مفصل" }).ok);

  const errors = (data: object) => {
    const r = parseRequest(data);
    return r.ok ? {} : r.errors;
  };
  assert.ok(errors({ ...base, type: "meeting" }).meetingType);
  assert.ok(errors({ ...base, type: "quote", services: [], business: "كوفي", message: "نحتاج موقع تعريفي" }).services);
  assert.ok(errors({ ...base, type: "quote", services: ["web"], message: "نحتاج موقع تعريفي" }).business);
  assert.ok(errors({ ...base, type: "inquiry" }).message);
  assert.ok(errors({ ...base, type: "partner", business: "جهة" }).message);
});

test("a request needs a phone or an email, and both are checked", () => {
  const r = parseRequest({ idem, name: "سارة", type: "inquiry", subject: "سؤال", message: "سؤال طويل" });
  assert.ok(!r.ok && r.errors.phone);
  const viaEmail = parseRequest({ idem, name: "سارة", email: "Sara@Example.com", type: "inquiry", subject: "سؤال", message: "سؤال طويل" });
  assert.ok(viaEmail.ok && viaEmail.data.email === "sara@example.com");
  const badEmail = parseRequest({ idem, name: "سارة", email: "nope", type: "inquiry", subject: "سؤال", message: "سؤال طويل" });
  assert.ok(!badEmail.ok && badEmail.errors.email);
});

test("meeting days are checked against today's date in Riyadh", () => {
  const meeting = (day: string) => parseRequest({ idem, name: "سارة", phone: "0501234567", type: "meeting", meetingType: "مكالمة هاتفية", day });
  assert.ok(meeting(riyadhToday()).ok);
  assert.ok(meeting(riyadhToday(30)).ok);
  assert.ok(!meeting(riyadhToday(-1)).ok);
  assert.ok(!meeting(riyadhToday(400)).ok);
  assert.ok(!meeting("14/11/2026").ok);
});

test("over-long and control-character input is rejected or cleaned", () => {
  const long = parseRequest({ idem, name: "س".repeat(500), phone: "0501234567", type: "inquiry", subject: "سؤال", message: "سؤال طويل" });
  assert.ok(!long.ok && long.errors.name);
  const cleaned = parseRequest({ idem, name: "  سارة\u0000 ", phone: "050 123-4567", type: "inquiry", subject: "سؤال", message: "سؤال طويل" });
  assert.ok(cleaned.ok && cleaned.data.name === "سارة" && cleaned.data.phone === "0501234567");
});

test("statuses follow the request type", () => {
  assert.deepEqual(statusesFor("meeting"), ["new", "in_progress", "meeting_confirmed", "closed"]);
  assert.deepEqual(statusesFor("quote"), ["new", "in_progress", "quote_sent", "closed"]);
  assert.deepEqual(statusesFor("partner"), ["new", "in_progress", "closed"]);
});

test("format checks accept what the dashboard stores and nothing looser", () => {
  assert.ok(isUuid(idem));
  assert.ok(!isUuid(undefined) && !isUuid("") && !isUuid("not-a-uuid") && !isUuid(`${idem}x`));
  assert.ok(isSlug("social-media") && isSlug("eid2026"));
  assert.ok(!isSlug("Social") && !isSlug("-lead") && !isSlug("double--dash") && !isSlug("مسار"));
  assert.ok(isEmailLike("a@b.co") && !isEmailLike("a@b") && !isEmailLike("a b@c.d"));
  assert.ok(isIsoDate("2026-11-14") && !isIsoDate("14/11/2026") && !isIsoDate(undefined));
});

test("intent labels name each request type; untrusted strings are checked before use", () => {
  assert.equal(intentLabel("quote"), "طلب عرض سعر");
  assert.ok(isContactIntent("partner") && !isContactIntent("something-else"));
  assert.ok(isRequestStatus("quote_sent") && !isRequestStatus("deleted"));
  assert.ok(isRole("editor") && !isRole("admin"));
});

test("request filters from the query string keep known keys and valid values only", () => {
  assert.deepEqual(parseRequestFilters({ q: "سارة", type: "quote", status: "bogus", page: "2", evil: "1", open: "" }), { q: "سارة", type: "quote" });
  assert.deepEqual(parseRequestFilters({ type: "nope", status: "closed", assignee: "none" }), { assignee: "none", status: "closed" });
});

test("saving a work's media: keep, retitle, remove, append, reorder, and derive the cover", () => {
  const img = (src: string, alt?: string) => ({ type: "image" as const, src, w: 1, h: 1, alt });
  const vid = (src: string, poster?: string) => ({ type: "video" as const, src, w: 1, h: 1, poster });
  const existing: MediaItem[] = [vid("/media/v1.mp4"), img("/media/a.webp", "old alt"), img("/media/b.webp")];
  const result = reconcileWorkMedia({
    existing,
    remove: ["/media/b.webp", "/media/not-there.webp"],
    altFor: (i) => (i === 1 ? "new alt" : ""),
    uploaded: [img("/media/c.webp")],
    firstSrc: "/media/c.webp",
  });
  assert.deepEqual(result.media.map((m) => m.src), ["/media/c.webp", "/media/v1.mp4", "/media/a.webp"]);
  assert.equal(result.media.find((m) => m.src === "/media/a.webp")!.alt, "new alt");
  assert.equal(result.cover, "/media/c.webp", "the first image is the cover");
  assert.equal(result.media.find((m) => m.type === "video")!.poster, "/media/c.webp", "posterless videos get the cover");
  assert.deepEqual(result.removed, ["/media/b.webp"], "only media that existed is reported for deletion");
  assert.equal(existing[0].poster, undefined, "the input list is not modified");

  const videosOnly = reconcileWorkMedia({ existing: [vid("/media/v.mp4", "/media/p.webp")], remove: [], altFor: () => "", uploaded: [], firstSrc: "" });
  assert.equal(videosOnly.cover, "/media/p.webp", "with no image, the first video's poster is the cover");
  assert.equal(reconcileWorkMedia({ existing: [], remove: [], altFor: () => "", uploaded: [], firstSrc: "" }).cover, null);
});

test("form helpers trim, cut to length and split lines", () => {
  const f = new FormData();
  f.set("title", "  عنوان  ");
  f.set("long", "x".repeat(50));
  f.set("items", " أول \n\n ثاني \n");
  f.set("intent", "publish");
  assert.equal(field(f, "title"), "عنوان");
  assert.equal(field(f, "long", 10).length, 10);
  assert.equal(field(f, "missing"), "");
  assert.deepEqual(fieldLines(f, "items", 100), ["أول", "ثاني"]);
  assert.equal(publishState(f), "published");
  f.set("intent", "draft");
  assert.equal(publishState(f), "draft");
});

/** The URL a server action redirected to (Next.js throws a NEXT_REDIRECT error carrying it). */
function redirectTarget(fn: () => never) {
  try {
    fn();
  } catch (e) {
    const digest = (e as { digest?: string }).digest ?? "";
    assert.ok(digest.startsWith("NEXT_REDIRECT"), "expected a redirect");
    return new URL(digest.split(";")[2], "http://x");
  }
  assert.fail("no redirect");
}

test("flash messages travel signed, so a crafted link can't show its own text", () => {
  const ok = redirectTarget(() => redirectWithMessage("/admin/faqs", { ok: "تم الحفظ." }));
  assert.equal(ok.pathname, "/admin/faqs");
  assert.equal(ok.searchParams.get("ok"), "تم الحفظ.");
  assert.equal(ok.searchParams.get("sig"), fingerprint("تم الحفظ."));
  const plain = redirectTarget(() => redirectWithMessage("/admin/login"));
  assert.equal(plain.search, "");
});

test("structured data adds the schema.org context and escapes markup from content", () => {
  const html = (JsonLd({ data: { "@type": "Thing", name: "</script><b>" } }).props as { dangerouslySetInnerHTML: { __html: string } })
    .dangerouslySetInnerHTML.__html;
  assert.ok(!html.includes("<"), "no raw < may reach the page");
  assert.deepEqual(JSON.parse(html), { "@context": "https://schema.org", "@type": "Thing", name: "</script><b>" });
  const crumbs = breadcrumbs([{ name: "أعمالنا", url: "https://x/work" }]);
  assert.deepEqual(
    crumbs.itemListElement.map((c) => [c.position, c.name]),
    [[1, "الرئيسية"], [2, "أعمالنا"]],
  );
});
