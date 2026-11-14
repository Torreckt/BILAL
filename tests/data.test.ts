// Checks the dashboard's data layer (lib/admin/*, lib/events, lib/audit) against a real PostgreSQL database.
// Needs TEST_DATABASE_URL pointing at a throwaway database: it is wiped. Skipped when the variable is unset.
// Usage: TEST_DATABASE_URL=postgres://... npm run test:data
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";

const DB = process.env.TEST_DATABASE_URL;

describe("data layer", { skip: !DB && "set TEST_DATABASE_URL to run" }, () => {
  // Imported after DATABASE_URL points at the test database (lib/db reads it on first import).
  let sql: typeof import("../lib/db").sql;
  let requests: typeof import("../lib/admin/requests");
  let users: typeof import("../lib/admin/users");
  let content: typeof import("../lib/admin/content");
  let events: typeof import("../lib/events");
  let audit: typeof import("../lib/audit");
  let rateLimit: typeof import("../lib/rate-limit");
  let requestsPublic: typeof import("../lib/requests");
  let notify: typeof import("../lib/notify");
  let siteContent: typeof import("../lib/content");
  let owner: string;
  let agent: string;

  const addRequest = async (fields: Record<string, unknown> = {}) => {
    const [row] = await sql<{ id: string }[]>`
      insert into requests ${sql({ ref: `MS-${randomUUID().slice(0, 8)}`, idem_key: randomUUID(), type: "inquiry", name: "عميل", phone: "0500000000", ...fields })}
      returning id`;
    return row.id;
  };

  before(async () => {
    process.env.DATABASE_URL = DB;
    ({ sql } = await import("../lib/db"));
    await sql`drop schema public cascade`;
    await sql`create schema public`;
    execFileSync("npx", ["tsx", "scripts/migrate.ts"], { env: { ...process.env, DATABASE_URL: DB }, stdio: "pipe" });
    requests = await import("../lib/admin/requests");
    users = await import("../lib/admin/users");
    content = await import("../lib/admin/content");
    events = await import("../lib/events");
    audit = await import("../lib/audit");
    rateLimit = await import("../lib/rate-limit");
    requestsPublic = await import("../lib/requests");
    notify = await import("../lib/notify");
    siteContent = await import("../lib/content");
    owner = (await users.insertUser("owner", "المالك", "owner", "x"))!;
    agent = (await users.insertUser("agent", "المتابع", "agent", "x"))!;
    await users.insertUser("editor", "المحرر", "editor", "x");
  });

  after(async () => {
    await sql?.end();
  });

  test("the follow-up rule: new for over a day, or open and untouched for three days", async () => {
    await sql`delete from requests`;
    await addRequest({ status: "new" }); // fresh
    await addRequest({ status: "new", created_at: sql`now() - interval '2 days'` }); // follow up
    await addRequest({ status: "in_progress", updated_at: sql`now() - interval '4 days'` }); // follow up
    await addRequest({ status: "in_progress", updated_at: sql`now() - interval '1 day'` }); // recent work
    await addRequest({ status: "closed", updated_at: sql`now() - interval '9 days'` }); // done
    await addRequest({ status: "in_progress", assignee_id: agent, notify_status: "failed" });

    const stats = await requests.requestStats(agent);
    assert.deepEqual(stats, { fresh: 2, follow: 2, open: 5, failed: 1, mine: 1 });
    const listed = await requests.listRequests({ follow: "1" }, 1, 25);
    assert.equal(listed.total, 2, "the list and the dashboard count the same requests");
    assert.equal(await requests.countNewRequests(), 2);
  });

  test("request filters combine, and malformed filter values are ignored", async () => {
    await sql`delete from requests`;
    await addRequest({ name: "سارة", type: "quote", services: ["social-media"], business: "مقهى الورد" });
    await addRequest({ name: "خالد", type: "meeting", email: "k@test.local", phone: null });
    await addRequest({ name: "نورة", type: "quote", services: ["photo"], status: "closed", assignee_id: agent });

    const total = async (f: Parameters<typeof requests.listRequests>[0]) => (await requests.listRequests(f, 1, 25)).total;
    assert.equal(await total({}), 3);
    assert.equal(await total({ type: "quote" }), 2);
    assert.equal(await total({ type: "quote", open: "1" }), 1);
    assert.equal(await total({ service: "photo" }), 1);
    assert.equal(await total({ q: "الورد" }), 1, "search covers the business name");
    assert.equal(await total({ q: "k@test" }), 1, "search covers the email");
    assert.equal(await total({ q: "%" }), 0, "a % typed in search is literal, not a wildcard");
    assert.equal(await total({ assignee: agent }), 1);
    assert.equal(await total({ assignee: "none" }), 2);
    assert.equal(await total({ assignee: "'; drop table requests; --", from: "yesterday" }), 3);

    const page = await requests.listRequests({}, 2, 2);
    assert.equal(page.rows.length, 1, "second page holds the remainder");
    assert.equal(page.total, 3);
  });

  test("request workflow: status, assignment, notes and deletion", async () => {
    const id = await addRequest({ type: "meeting" });
    assert.deepEqual(await requests.requestWorkflowState(id), { type: "meeting", status: "new", assignee_id: null });

    const closedAt = async () => (await sql<{ closed_at: Date | null }[]>`select closed_at from requests where id = ${id}`)[0].closed_at;
    await requests.setRequestStatus(id, "closed");
    assert.ok(await closedAt(), "closing stamps closed_at");
    assert.equal((await requests.getRequest(id))!.status, "closed");
    await requests.setRequestStatus(id, "in_progress");
    assert.equal(await closedAt(), null, "reopening clears it");

    assert.equal(await users.requestStaffName(agent), "المتابع");
    const [editor] = await sql<{ id: string }[]>`select id from users where role = 'editor'`;
    assert.equal(await users.requestStaffName(editor.id), undefined, "editors can't be assigned requests");
    await requests.assignRequest(id, agent);
    await requests.addRequestNote(id, owner, "اتصلنا وما رد");
    const notes = await requests.requestNotes(id);
    assert.deepEqual(notes.map((n) => [n.body, n.author]), [["اتصلنا وما رد", "المالك"]]);

    const ref = (await requests.getRequest(id))!.ref;
    assert.equal(await requests.deleteRequest(id), ref);
    assert.equal(await requests.deleteRequest(id), undefined, "a second delete finds nothing");
    assert.equal((await sql`select 1 from request_notes where request_id = ${id}`).length, 0, "notes go with the request");
  });

  test("parallel wrong passwords are all counted (no lost updates)", async () => {
    await users.clearFailedLogins(agent);
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => users.recordFailedLogin(agent)));
    assert.equal(results.filter(Boolean).length, 1, "exactly one of five simultaneous failures locks the account");
    assert.equal((await users.findActiveUserByUsername("agent"))!.locked, true);
    await users.setPasswordHash(agent, "x");
  });

  test("the fifth wrong password in a row locks the account", async () => {
    for (let i = 1; i <= 4; i++) {
      const u = (await users.findActiveUserByUsername("agent"))!;
      assert.equal(await users.recordFailedLogin(u.id), false, `attempt ${i} doesn't lock`);
    }
    const u = (await users.findActiveUserByUsername("agent"))!;
    assert.equal(await users.recordFailedLogin(u.id), true);
    assert.equal((await users.findActiveUserByUsername("agent"))!.locked, true);
    await users.setPasswordHash(agent, "new-hash");
    const reset = (await users.findActiveUserByUsername("agent"))!;
    assert.equal(reset.locked, false, "an owner's password reset lifts the lock");
    assert.equal(reset.failed_logins, 0);
  });

  test("account management: duplicates, roles and deactivation", async () => {
    assert.equal(await users.insertUser("owner", "نسخة", "agent", "x"), undefined, "a username registers once");
    await users.setRole(agent, "editor");
    assert.equal((await users.getUser(agent))!.role, "editor");
    assert.ok(!(await users.listRequestStaff()).some((s) => s.id === agent), "no longer offered for requests");
    await users.setActive(agent, false);
    await users.setActive(agent, false);
    assert.equal(await users.findActiveUserByUsername("agent"), undefined, "inactive accounts can't sign in; repeating the change keeps it off");
    await users.setActive(agent, true);
    await users.setRole(agent, "agent");
  });

  test("content rows save, keep slugs unique, and store media as JSON", async () => {
    const service = { slug: "seo", code: "SEO", title: "سيو", line: "ظهور أعلى" };
    const id = await content.saveContentRow("services", "", service);
    assert.ok(id);
    assert.equal(await content.slugTaken("services", "seo", ""), true);
    assert.equal(await content.slugTaken("services", "seo", id!), false, "a row doesn't clash with itself");
    await assert.rejects(content.saveContentRow("services", "", { ...service, title: "نسخة" }), content.SlugTakenError);
    assert.equal(await content.saveContentRow("services", randomUUID(), { title: "x" }), undefined, "updating a missing row");

    const media = [{ type: "image", src: "/media/a.webp", w: 10, h: 10 }];
    const workId = await content.saveContentRow("works", "", { slug: "w1", title: "عمل", media: content.asJsonb(media) });
    assert.deepEqual(await content.workMedia(workId!), media);
    assert.equal((await content.getWorkById(workId!))!.title, "عمل");

    await content.saveContentRow("services", id!, { status: "published" });
    assert.deepEqual(await content.contentCounts(), { services: 1, works: 0, faqs: 0, drafts: 1 });
    const titles = await content.serviceTitles();
    assert.equal(titles.title("seo"), "سيو");
    assert.equal(titles.title("gone"), "gone", "unknown slugs fall back to the slug");

    await content.deleteContentRow("works", workId!);
    assert.equal(await content.getWorkById(workId!), undefined);
  });

  test("calendar dates come back as YYYY-MM-DD text, not shifted Date objects", async () => {
    const id = await addRequest({ type: "meeting", meeting_day: "2026-11-20" });
    assert.equal((await requests.getRequest(id))!.meeting_day, "2026-11-20");
  });

  test("rate limits count per key within a window", async () => {
    const key = `test:${randomUUID()}`;
    const window = { limit: 2, windowSeconds: 600 };
    const allowed = [];
    for (let i = 0; i < 3; i++) allowed.push(await rateLimit.consumeRateLimit(key, window));
    assert.deepEqual(allowed, [true, true, false]);
    assert.equal(await rateLimit.consumeRateLimit(`${key}:other`, window), true, "another key has its own count");
  });

  test("a quote may only name published services", async () => {
    await sql`delete from services`;
    await content.saveContentRow("services", undefined, { slug: "ads", code: "ADS", title: "إعلانات", line: "x", status: "published" });
    await content.saveContentRow("services", undefined, { slug: "draft-one", code: "D", title: "مسودة", line: "x" });
    const quote = (services: string[]) => {
      const parsed = requestsPublic.parseRequest({
        idem: randomUUID(), type: "quote", name: "سارة", phone: "0501234567", business: "مقهى", message: "أبغى عرض سعر للإعلانات", services,
      });
      assert.ok(parsed.ok);
      return requestsPublic.checkReferences(parsed.data);
    };
    assert.equal(await quote(["ads"]), null);
    assert.deepEqual(await quote(["ads", "draft-one"]), { services: "اختر الخدمات من القائمة" });
    assert.deepEqual(await quote(["made-up"]), { services: "اختر الخدمات من القائمة" });
  });

  test("a failed notification is recorded on the request instead of thrown", async () => {
    const id = await addRequest();
    await notify.notifyRequest(id); // no SMTP configured in tests
    const [row] = await sql<{ notify_status: string; notify_attempts: number }[]>`select notify_status, notify_attempts from requests where id = ${id}`;
    assert.deepEqual(row, { notify_status: "failed", notify_attempts: 1 });
    await notify.notifyRequest(randomUUID()); // a missing request is ignored quietly
  });

  test("a stored setting of the wrong kind falls back to the default", async () => {
    await sql`insert into settings (key, value) values ('notify_email', ${sql.json(42 as never)})
              on conflict (key) do update set value = excluded.value`;
    assert.equal(await siteContent.getSetting("notify_email", "team@test.local"), "team@test.local");
  });

  test("settings upsert, events count by name, audit entries list newest first", async () => {
    await content.saveSetting("retention_days", 90);
    await content.saveSetting("retention_days", 30);
    const [{ value }] = await sql<{ value: number }[]>`select value from settings where key = 'retention_days'`;
    assert.equal(value, 30);

    await events.recordEvent({ name: "whatsapp_click", requestType: "quote", service: "seo", source: "/" });
    await events.recordEvent({ name: "whatsapp_click" });
    await events.recordEvent({ name: "request_saved", requestType: "quote" });
    const count = await events.eventCounts(30);
    assert.equal(count("whatsapp_click"), 2);
    assert.equal(count("never"), 0);

    const id = await addRequest();
    await audit.audit({ id: owner, name: "المالك" }, "request.note", "request", id);
    await audit.audit(null, "request.status", "request", id, { to: "مغلق" });
    const history = await audit.auditFor("request", id);
    assert.deepEqual(history.map((h) => h.action), ["request.status", "request.note"]);
    assert.equal(history[0].actor_name, null);
    assert.ok((await audit.recentAudit(1)).length === 1);
  });
});
