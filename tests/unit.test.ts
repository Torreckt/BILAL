// Fast checks that need no database or server. Usage: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { decrypt, encrypt, hashPassword, totpAt, verifyPassword, verifyTotp } from "../lib/crypto";
import { parseRequest } from "../lib/requests";
import { riyadhToday, statusesFor } from "../lib/site";

const idem = "3f2b8c1e-5d4a-4b6f-9e21-0a1b2c3d4e5f";

test("TOTP matches the RFC 6238 reference value", () => {
  assert.equal(totpAt("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1), "287082");
});

test("a TOTP code is accepted once, within one step of drift", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const now = 1_700_000_000_000;
  const step = Math.floor(now / 30000);
  assert.equal(verifyTotp(secret, totpAt(secret, step), 0, now), step);
  assert.equal(verifyTotp(secret, totpAt(secret, step - 1), 0, now), step - 1);
  assert.equal(verifyTotp(secret, totpAt(secret, step), step, now), null, "replay");
  assert.equal(verifyTotp(secret, totpAt(secret, step - 5), 0, now), null, "too old");
});

test("passwords verify only against their own hash", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.ok(await verifyPassword("correct horse battery", hash));
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
});

test("secrets survive encryption and reject tampering", () => {
  const packed = encrypt("JBSWY3DPEHPK3PXP");
  assert.equal(decrypt(packed), "JBSWY3DPEHPK3PXP");
  assert.throws(() => decrypt(packed.slice(0, -4) + "AAAA"));
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
  assert.ok(errors({ ...base, type: "inquiry", message: "كم المدة؟" }).subject);
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
  const meeting = (day: string) => parseRequest({ idem, name: "سارة", phone: "0501234567", type: "meeting", meetingType: "اجتماع حضوري", day });
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
