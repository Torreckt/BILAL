// End-to-end check of the whole site against a real PostgreSQL database and a production build.
// Needs: `npm run build` done, and TEST_DATABASE_URL pointing at a throwaway database (it is wiped).
// Usage: TEST_DATABASE_URL=postgres://... npm run test:e2e
import { execFileSync, spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright"); // devDependency, or the machine's global install
import postgres from "postgres";

const DB = process.env.TEST_DATABASE_URL;
if (!DB) throw new Error("set TEST_DATABASE_URL to a throwaway database");
const PORT = 3210;
const BASE = `http://localhost:${PORT}`;
const SMTP_PORT = 2526;
const PASSWORD = "test-password-12345";
const uploads = mkdtempSync(join(tmpdir(), "ms-uploads-"));
const env = {
  ...process.env,
  DATABASE_URL: DB,
  SITE_URL: BASE,
  INSECURE_COOKIES: "1",
  UPLOAD_DIR: uploads,
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: String(SMTP_PORT),
  SMTP_FROM: "site@test.local",
  NOTIFY_EMAIL: "team@test.local",
  ADMIN_PASSWORD: PASSWORD,
  APP_SECRET: "test-secret-test-secret-test-secret-0000",
};
const run = (...args) => execFileSync("npx", ["tsx", ...args], { env, stdio: "pipe" });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  → ${detail}`}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Setup: clean database, migrations, seed, three accounts ──
const sql = postgres(DB, { onnotice: () => {} });
await sql`drop schema public cascade`;
await sql`create schema public`;
run("scripts/migrate.ts");
run("scripts/seed.ts");
run("scripts/create-admin.ts", "owner@test.local", "المالك", "owner");
run("scripts/create-admin.ts", "agent@test.local", "مسؤول المتابعة", "agent");
run("scripts/create-admin.ts", "editor@test.local", "محرر المحتوى", "editor");
run("scripts/create-admin.ts", "lock@test.local", "حساب القفل", "agent");

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { env, stdio: "pipe" });
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
for (let i = 0; i < 60; i++) {
  if (await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false)) break;
  await sleep(500);
}

// Minimal SMTP sink, started later to prove "notification failed → retry → sent".
const mails = [];
function startSmtp() {
  return new Promise((ready) => {
    const srv = createServer((sock) => {
      let data = false;
      let body = "";
      sock.write("220 test\r\n");
      sock.on("data", (chunk) => {
        const text = chunk.toString();
        if (data) {
          body += text;
          if (body.endsWith("\r\n.\r\n")) {
            mails.push(body);
            data = false;
            sock.write("250 ok\r\n");
          }
          return;
        }
        for (const line of text.split("\r\n").filter(Boolean)) {
          if (/^DATA/i.test(line)) {
            data = true;
            body = "";
            sock.write("354 go\r\n");
          } else if (/^QUIT/i.test(line)) sock.end("221 bye\r\n");
          else sock.write("250 ok\r\n");
        }
      });
    }).listen(SMTP_PORT, "127.0.0.1", () => ready(srv));
  });
}

function totp(secret) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret) bits += A.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac("sha1", key).update(msg).digest();
  const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, "0");
}

const browser = await chromium.launch();
let ipCounter = 10;
const newContext = (opts = {}) => browser.newContext({ ...opts, extraHTTPHeaders: { "x-forwarded-for": `10.0.0.${ipCounter++}` } });

async function signIn(email) {
  const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/mfa");
  const secret = (await page.textContent("code")).trim();
  await page.fill('input[name="code"]', totp(secret));
  await page.click('button:has-text("تأكيد")');
  await page.waitForURL(`${BASE}/admin`);
  return { ctx, page, secret };
}

// Submit a dashboard form and wait until the server action has answered and the page has settled.
async function act(page, target) {
  const posted = page.waitForResponse((r) => r.request().method() === "POST");
  await (typeof target === "string" ? page.click(target) : target.click());
  await posted;
  await page.waitForLoadState("networkidle");
  await sleep(150);
}

const api = (body, headers = {}) =>
  fetch(`${BASE}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": `10.1.0.${ipCounter++}`, ...headers },
    body: JSON.stringify({ elapsed: 5000, ...body }),
  });
const uuid = () => crypto.randomUUID();
const count = async () => (await sql`select count(*)::int as n from requests`)[0].n;

try {
  /* ───── 1. Main path: phone visitor asks for a quote from a service page ───── */
  const phone = await newContext({ ...devices["iPhone 13"] });
  const visitor = await phone.newPage();
  await visitor.goto(`${BASE}/services/web`);
  await visitor.click('a[href="#contact-quote"] >> nth=0');
  check("service page: quote type preselected", await visitor.isChecked('input[name="intent"][value="quote"]'));
  check("service page: this service preselected", await visitor.isChecked('.quote__chip:has-text("تصميم المواقع") input'));
  await visitor.fill('input[name="name"]', "عميل تجربة الجوال");
  await visitor.fill('input[name="phone"]', "0501234567");
  await visitor.fill('input[name="business"]', "كوفي التجربة");
  await visitor.fill('textarea[name="message"]', "نحتاج موقع تعريفي مع صفحة حجز.");
  await sleep(2600);
  await visitor.dblclick('button:has-text("أرسل الطلب")'); // double tap must still create one request
  await visitor.waitForSelector(".sent__ref strong");
  const ref = (await visitor.textContent(".sent__ref strong")).trim();
  check("visitor gets a reference number", /^MS-[2-9A-Z]{6}$/.test(ref), ref);
  const waHref = await visitor.getAttribute('.sent__actions a[href*="wa.me"]', "href");
  check("WhatsApp follow-up carries the reference", decodeURIComponent(waHref).includes(ref));
  const [saved] = await sql`select * from requests where ref = ${ref}`;
  check("request stored with type, service and source", saved?.type === "quote" && saved.services[0] === "web" && saved.source === "/services/web");
  check("double tap stored a single request", (await count()) === 1);
  check("phone layout has no sideways scroll", (await visitor.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await sleep(1500);
  const [afterNotify] = await sql`select notify_status, notify_error from requests where ref = ${ref}`;
  check("mail server down: request kept, notification marked failed", afterNotify.notify_status === "failed" && !!afterNotify.notify_error);

  /* ───── 2. The owner opens the same request and changes its status ───── */
  const owner = await signIn("owner@test.local");
  await owner.page.goto(`${BASE}/admin/requests?q=${ref}`);
  await owner.page.click(`a:has-text("${ref}")`);
  check("admin sees the customer's details", (await owner.page.textContent(".adm-facts")).includes("عميل تجربة الجوال"));
  check("failed notification is shown with a retry button", await owner.page.isVisible('button:has-text("أعد إرسال التنبيه")'));
  await owner.page.selectOption('select[name="status"]', "quote_sent");
  await owner.page.selectOption('select[name="assignee"]', { label: "مسؤول المتابعة" });
  await owner.page.fill('textarea[name="note"]', "أرسلنا العرض على الواتساب.");
  await act(owner.page, 'button:has-text("حفظ")');
  const [changed] = await sql`select status, assignee_id from requests where ref = ${ref}`;
  check("status changed to «تم إرسال العرض»", changed.status === "quote_sent" && !!changed.assignee_id);
  const log = await sql`select action, actor_name, meta from audit_log where entity = 'request' and entity_id = ${saved.id}`;
  check("history records who changed the status and when", log.some((l) => l.action === "request.status" && l.actor_name === "المالك" && l.meta.to === "تم إرسال العرض"));
  check("note and assignment are logged", log.some((l) => l.action === "request.note") && log.some((l) => l.action === "request.assigned"));

  const smtp = await startSmtp();
  await act(owner.page, 'button:has-text("أعد إرسال التنبيه")');
  const [resent] = await sql`select notify_status, notify_attempts from requests where ref = ${ref}`;
  check("retry sends the notification once mail works", resent.notify_status === "sent" && resent.notify_attempts === 2 && mails.length === 1);
  // The message body is base64 (Arabic text), so decode it before looking for the reference.
  const mailText = mails[0] ? Buffer.from(mails[0].split("\r\n\r\n").slice(1).join(""), "base64").toString() : "";
  check("notification email names the reference and links to the request", mailText.includes(ref) && mailText.includes(`/admin/requests/${saved.id}`), mailText.slice(0, 200));

  /* ───── 3. The other three request types, validation, duplicates, spam ───── */
  const before = await count();
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(Date.now() + 864e5);
  const meeting = await api({ type: "meeting", idem: uuid(), name: "سارة", email: "Sara@Example.com", meetingType: "اجتماع أونلاين", day: tomorrow, time: "العصر" });
  const inquiry = await api({ type: "inquiry", idem: uuid(), name: "خالد", phone: "+966501112223", subject: "مدة التنفيذ", message: "كم يأخذ تصميم الهوية؟" });
  const partner = await api({ type: "partner", idem: uuid(), name: "نورة", phone: "0551112223", business: "استوديو الضوء", message: "نقترح تعاون في تصوير الحملات." });
  check("meeting, inquiry and partnership requests are accepted", meeting.ok && inquiry.ok && partner.ok && (await count()) === before + 3);
  const [m] = await sql`select email, meeting_day::text as day, notify_status from requests where name = 'سارة'`;
  check("meeting stores the preferred day and normalised email", m.day === tomorrow && m.email === "sara@example.com");
  await sleep(1200);
  check("notification is sent automatically when mail works", (await sql`select notify_status from requests where name = 'سارة'`)[0].notify_status === "sent");

  const bad = [
    ["no phone or email", { type: "inquiry", idem: uuid(), name: "بدون تواصل", subject: "س", message: "سؤال بدون وسيلة تواصل" }, "phone"],
    ["meeting day in the past (Riyadh time)", { type: "meeting", idem: uuid(), name: "قديم", phone: "0500000000", meetingType: "اجتماع حضوري", day: "2020-01-01" }, "day"],
    ["quote without a service", { type: "quote", idem: uuid(), name: "عرض", phone: "0500000000", business: "نشاط", message: "وصف كافي للاحتياج", services: [] }, "services"],
    ["quote with an unknown service", { type: "quote", idem: uuid(), name: "عرض", phone: "0500000000", business: "نشاط", message: "وصف كافي للاحتياج", services: ["nope"] }, "services"],
    ["partnership without a proposal", { type: "partner", idem: uuid(), name: "جهة", phone: "0500000000", business: "جهة" }, "message"],
    ["invalid phone", { type: "inquiry", idem: uuid(), name: "رقم", phone: "abc", subject: "س", message: "سؤال طويل" }, "phone"],
    ["unknown type", { type: "other", idem: uuid(), name: "نوع", phone: "0500000000" }, "type"],
  ];
  for (const [name, body, field] of bad) {
    const res = await api(body);
    const data = await res.json();
    check(`rejected with a field error: ${name}`, res.status === 422 && !!data.errors?.[field], JSON.stringify(data));
  }
  check("rejected requests are not stored", (await count()) === before + 3);

  const idem = uuid();
  const dupBody = { type: "inquiry", idem, name: "مكرر", phone: "0509998887", subject: "تكرار", message: "نفس الطلب مرتين" };
  const [d1, d2] = await Promise.all([api(dupBody), api(dupBody)]);
  const d3 = await api(dupBody); // a retry after a dropped connection
  const refs = await Promise.all([d1, d2, d3].map((r) => r.json().then((j) => j.ref)));
  check("same submission three times → one request, same reference", new Set(refs).size === 1 && (await sql`select count(*)::int as n from requests where idem_key = ${idem}`)[0].n === 1);

  const nBefore = await count();
  const bot = await api({ ...dupBody, idem: uuid(), website: "http://spam.example" });
  const fast = await api({ ...dupBody, idem: uuid(), elapsed: 300 });
  check("honeypot and too-fast submissions are dropped silently", bot.ok && fast.ok && (await count()) === nBefore);
  const cross = await api({ ...dupBody, idem: uuid() }, { Origin: "https://evil.example" });
  check("cross-site submission is refused", cross.status === 403);
  const sameIp = { "x-forwarded-for": "10.9.9.9" };
  const burst = [];
  for (let i = 0; i < 7; i++) burst.push((await api({ ...dupBody, idem: uuid(), name: `سيل ${i}` }, sameIp)).status);
  check("rate limit: sixth request from one address in ten minutes gets 429", burst.slice(0, 5).every((s) => s === 200) && burst[5] === 429 && burst[6] === 429, burst.join(","));

  // Errors shown in the form itself, in Arabic
  const form = await newContext({ viewport: { width: 1280, height: 900 } });
  const fp = await form.newPage();
  await fp.goto(`${BASE}/#contact-quote`);
  await sleep(2700);
  await fp.click('button:has-text("أرسل الطلب")');
  await fp.waitForSelector('.quote__error[role="alert"]');
  const alerts = await fp.locator('.quote__error[role="alert"]').allTextContents();
  check("form shows field errors in Arabic and marks the fields", alerts.length >= 3 && alerts.some((a) => a.includes("اكتب اسمك")) && (await fp.getAttribute('input[name="name"]', "aria-invalid")) === "true", alerts.join(" | "));
  check("focus moves to the first invalid field", (await fp.evaluate(() => document.activeElement?.getAttribute("name"))) === "name");

  /* ───── 4. Sign-in and permissions ───── */
  const anon = await newContext();
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/admin/requests/${saved.id}`);
  check("signed-out visit to a request redirects to sign-in", ap.url().endsWith("/admin/login") && !(await ap.content()).includes("عميل تجربة الجوال"));
  const adminHeaders = await fetch(`${BASE}/admin/login`);
  check("dashboard pages are marked noindex and not cached", adminHeaders.headers.get("x-robots-tag")?.includes("noindex") && adminHeaders.headers.get("cache-control") === "no-store");
  await ap.fill('input[name="email"]', "owner@test.local");
  await ap.fill('input[name="password"]', "wrong-password-000");
  await act(ap, 'button[type="submit"]');
  check("wrong password is refused with one generic message", ap.url().includes("error=") && (await ap.isVisible(".adm-flash--error")));

  // Password alone is not enough: without the code the dashboard stays shut.
  const half = await newContext();
  const hp = await half.newPage();
  await hp.goto(`${BASE}/admin/login`);
  await hp.fill('input[name="email"]', "owner@test.local");
  await hp.fill('input[name="password"]', PASSWORD);
  await hp.click('button[type="submit"]');
  await hp.waitForURL("**/admin/mfa");
  await hp.goto(`${BASE}/admin/requests`);
  check("password without the second step cannot open the dashboard", hp.url().endsWith("/admin/mfa"));
  await hp.fill('input[name="code"]', "000000");
  await act(hp, 'button:has-text("تأكيد")');
  check("wrong verification code is refused", hp.url().includes("error="));
  await hp.fill('input[name="code"]', totp(owner.secret));
  await act(hp, 'button:has-text("تأكيد")');
  check("a verification code cannot be used twice", hp.url().includes("error="), hp.url());

  // Lockout after repeated wrong passwords
  const lock = await newContext();
  const lp = await lock.newPage();
  for (let i = 0; i < 5; i++) {
    await lp.goto(`${BASE}/admin/login`);
    await lp.fill('input[name="email"]', "lock@test.local");
    await lp.fill('input[name="password"]', `wrong-password-${i}`);
    await act(lp, 'button[type="submit"]');
  }
  await lp.goto(`${BASE}/admin/login`);
  await lp.fill('input[name="email"]', "lock@test.local");
  await lp.fill('input[name="password"]', PASSWORD);
  await act(lp, 'button[type="submit"]');
  check("account locks after five wrong passwords", lp.url().includes("error="));

  const agent = await signIn("agent@test.local");
  const editor = await signIn("editor@test.local");
  await agent.page.goto(`${BASE}/admin/requests/${saved.id}`);
  check("agent can open requests", (await agent.page.textContent(".adm-main")).includes("عميل تجربة الجوال"));
  check("agent has no delete button", !(await agent.page.isVisible('button:has-text("حذف الطلب")')));
  for (const path of ["/admin/services", "/admin/works", "/admin/users", "/admin/audit", "/admin/settings"]) {
    await agent.page.goto(BASE + path);
    check(`agent is refused ${path}`, agent.page.url().includes("denied=1"));
  }
  for (const path of ["/admin/requests", `/admin/requests/${saved.id}`, "/admin/users", "/admin/audit"]) {
    await editor.page.goto(BASE + path);
    check(`editor is refused ${path}`, editor.page.url().includes("denied=1") && !(await editor.page.content()).includes("عميل تجربة الجوال"));
  }

  // Calling an action directly with the wrong role: the editor's FAQ form, submitted with the agent's session.
  await editor.page.goto(`${BASE}/admin/faqs`);
  await editor.page.click("details >> nth=0 >> summary");
  await editor.page.fill('details >> nth=0 >> input[name="question"]', "سؤال من غير صلاحية؟");
  await editor.page.fill('details >> nth=0 >> textarea[name="answer"]', "ما لازم ينحفظ.");
  const editorCookies = await editor.ctx.cookies();
  await editor.ctx.clearCookies();
  await editor.ctx.addCookies(await agent.ctx.cookies());
  await act(editor.page, 'details >> nth=0 >> button:has-text("حفظ ونشر")');
  check("content action with an agent session is refused on the server", editor.page.url().includes("denied=1") && (await sql`select 1 from faqs where question like 'سؤال من غير صلاحية%'`).length === 0);
  await editor.ctx.clearCookies();
  await editor.ctx.addCookies(editorCookies);
  await editor.page.goto(`${BASE}/admin/faqs`);
  await editor.page.click("details >> nth=0 >> summary");
  await editor.page.fill('details >> nth=0 >> input[name="question"]', "سؤال من غير دخول؟");
  await editor.page.fill('details >> nth=0 >> textarea[name="answer"]', "ما لازم ينحفظ.");
  await editor.ctx.clearCookies();
  await act(editor.page, 'details >> nth=0 >> button:has-text("حفظ ونشر")');
  check("content action with no session is refused on the server", !editor.page.url().includes("ok=") && (await sql`select 1 from faqs where question like 'سؤال من غير دخول%'`).length === 0, editor.page.url());
  await editor.ctx.addCookies(editorCookies);

  // Owner: permission changes are logged; public sign-up does not exist.
  await owner.page.goto(`${BASE}/admin/users`);
  const lockCard = owner.page.locator("section", { hasText: "lock@test.local" });
  await lockCard.locator('select[name="role"]').selectOption("editor");
  await act(owner.page, lockCard.locator('button:has-text("غيّر الدور")'));
  const roleLog = await sql`select meta from audit_log where action = 'user.role'`;
  check("role change is recorded in the audit log", roleLog[0]?.meta.from === "agent" && roleLog[0]?.meta.to === "editor");
  check("there is no public sign-up page", (await fetch(`${BASE}/admin/signup`, { redirect: "manual" })).status !== 200 && (await fetch(`${BASE}/admin/register`, { redirect: "manual" })).status !== 200);

  /* ───── 5. Content: draft → preview → publish ───── */
  await editor.page.goto(`${BASE}/admin/services/new`);
  await editor.page.fill('input[name="title"]', "خدمة تجريبية");
  await editor.page.fill('input[name="slug"]', "test-service");
  await editor.page.fill('input[name="line"]', "جملة تعريفية للتجربة.");
  await editor.page.fill('textarea[name="body"]', "## عنوان\nفقرة تجريبية.");
  await act(editor.page, 'button:has-text("حفظ كمسودة")');
  const pub = (path) => fetch(BASE + path, { redirect: "manual" });
  check("draft is hidden from the public", (await pub("/services/test-service")).status === 404);
  check("draft preview is refused to signed-out visitors", (await pub("/services/test-service?preview=1")).status === 404);
  check("draft is not in the sitemap or on the home page", !(await (await pub("/sitemap.xml")).text()).includes("test-service") && !(await (await pub("/")).text()).includes("خدمة تجريبية"));
  await editor.page.goto(`${BASE}/services/test-service?preview=1`);
  check("signed-in editor can preview the draft", (await editor.page.isVisible(".draft-bar")) && (await editor.page.textContent("h1")).includes("خدمة تجريبية"));
  await editor.page.goto(editor.page.url().replace(/\/services\/.*/, "/admin/services"));
  await editor.page.click('a:has-text("خدمة تجريبية")');
  await act(editor.page, 'button:has-text("حفظ ونشر")');
  const live = await pub("/services/test-service");
  check("published service is live", live.status === 200 && (await live.text()).includes("خدمة تجريبية"));
  check("published service appears in the sitemap and on the home page", (await (await pub("/sitemap.xml")).text()).includes(`${BASE}/services/test-service`) && (await (await pub("/")).text()).includes("خدمة تجريبية"));

  // Works: upload a real image, refuse a fake one.
  await editor.page.goto(`${BASE}/admin/works/new`);
  await editor.page.fill('input[name="title"]', "عمل تجريبي");
  await editor.page.fill('input[name="slug"]', "test-work");
  await editor.page.setInputFiles('input[name="files"]', "public/work/asmar-cafe/facade.jpg");
  await act(editor.page, 'button:has-text("حفظ كمسودة")');
  const [work] = await sql`select id, media, cover, status from works where slug = 'test-work'`;
  const src = work.media[0]?.src ?? "";
  const file = await pub(src);
  check("uploaded image is re-encoded to WebP and served", /^\/media\/[a-f0-9]{32}\.webp$/.test(src) && file.status === 200 && file.headers.get("content-type") === "image/webp" && work.cover === src);
  const fake = join(uploads, "evil.jpg");
  writeFileSync(fake, "<script>alert(1)</script> not an image");
  await editor.page.setInputFiles('input[name="files"]', fake);
  await act(editor.page, 'button:has-text("حفظ كمسودة")');
  check("a file that is not really an image is refused", (await sql`select media from works where slug = 'test-work'`)[0].media.length === 1);
  check("media route cannot read other files", (await pub("/media/..%2F..%2Fpackage.json")).status === 404 && (await pub("/media/package.json")).status === 404);
  check("draft work is hidden from the public", (await pub("/work/test-work")).status === 404);

  /* ───── 6. SEO files, links and security headers ───── */
  const home = await pub("/");
  const html = await home.text();
  check("home: canonical, share tags and structured data in the HTML", html.includes(`<link rel="canonical" href="${BASE}"/>`) && html.includes('property="og:image"') && html.includes('"@type":"FAQPage"') && html.includes("فريقك التسويقي المتكامل"));
  const svc = await (await pub("/services/social")).text();
  check("service page: own title, description and canonical", svc.includes("<title>إدارة حسابات السوشال ميديا في الرياض") && svc.includes(`<link rel="canonical" href="${BASE}/services/social"`) && svc.includes('"@type":"Service"'));
  const robots = await (await pub("/robots.txt")).text();
  check("robots.txt blocks the dashboard and points to the sitemap", robots.includes("Disallow: /admin") && robots.includes(`Sitemap: ${BASE}/sitemap.xml`));
  const sitemap = await (await pub("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((x) => x[1]);
  const statuses = await Promise.all(urls.map((u) => fetch(u).then((r) => r.status)));
  check(`every sitemap link works (${urls.length} pages) and none is under /admin`, urls.length >= 15 && statuses.every((s) => s === 200) && !urls.some((u) => u.includes("/admin")));
  const csp = home.headers.get("content-security-policy") ?? "";
  check("security headers are set", /script-src 'self' 'nonce-/.test(csp) && csp.includes("frame-ancestors 'none'") && home.headers.get("x-content-type-options") === "nosniff" && home.headers.get("strict-transport-security")?.includes("max-age") && home.headers.get("x-frame-options") === "DENY" && !home.headers.get("x-powered-by"));
  const old = await pub("/BILAL/services/web");
  check("old /BILAL links redirect permanently", old.status === 308 && old.headers.get("location") === "/services/web");
  const setCookie = (await owner.ctx.cookies()).find((c) => c.name.includes("ms_session"));
  check("session cookie is HttpOnly and SameSite", setCookie?.httpOnly && setCookie.sameSite === "Lax");

  // Every internal link and image on the public pages resolves.
  const crawl = await newContext();
  const cp = await crawl.newPage();
  const broken = [];
  const seen = new Set();
  for (const path of ["/", "/work", "/work/eid-night", "/services/photo", "/privacy"]) {
    await cp.goto(BASE + path);
    const links = await cp.$$eval("a[href^='/'], img[src^='/'], video source[src^='/'], video[poster^='/']", (els) => els.map((e) => e.getAttribute("href") ?? e.getAttribute("src") ?? e.getAttribute("poster")));
    for (const l of links) {
      const url = l.split("#")[0];
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const r = await fetch(BASE + url, { redirect: "manual" });
      if (r.status !== 200 && !(url.startsWith("/admin") && r.status === 307)) broken.push(`${url} (${r.status})`);
    }
  }
  check(`no broken internal links or media (${seen.size} checked)`, broken.length === 0, broken.join(", "));

  smtp.close();
} catch (e) {
  check("test run completed without crashing", false, e.stack);
  console.log(serverLog.slice(-1500));
} finally {
  await browser.close();
  server.kill();
  await sql.end();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
