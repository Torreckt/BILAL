import { after } from "next/server";
import { clientKey, consumeRateLimit } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/events";
import { notifyRequest } from "@/lib/notify";
import { checkReferences, parseRequest, saveRequest } from "@/lib/intake";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** True only when the Origin header parses and names this host; a malformed Origin is a rejection, not a crash. */
function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !URL.canParse(origin)) return false;
  return new URL(origin).host === host;
}

export async function POST(req: Request) {
  // Browsers always send Origin on cross-site POSTs; reject anything not coming from our own pages.
  if (!isSameOrigin(req)) return json({ error: "طلب غير مسموح" }, 403);
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) return json({ error: "الطلب كبير" }, 413);

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "بيانات غير صالحة" }, 400);
  const fields = body as Record<string, unknown>;

  // Spam traps: a hidden field people never fill, and forms submitted faster than a person can type (a missing
  // timer counts as too fast). Bots get a normal-looking answer so they don't adapt.
  if (fields.website || !(Number(fields.elapsed) >= 2500)) return json({ ok: true, ref: "MS-000000" });

  const ip = await clientKey();
  if (!(await consumeRateLimit(`req:${ip}`, { limit: 5, windowSeconds: 600 })) || !(await consumeRateLimit(`req-day:${ip}`, { limit: 30, windowSeconds: 86400 }))) {
    return json({ error: "أرسلت طلبات كثيرة. جرّب بعد شوي أو كلّمنا واتساب." }, 429);
  }

  const parsed = parseRequest(fields);
  if (!parsed.ok) return json({ errors: parsed.errors }, 422);
  const data = parsed.data;

  const references = await checkReferences(data);
  if (!references.ok) return json({ errors: references.errors }, 422);

  const saved = await saveRequest(data, ip);
  if (saved.created) {
    await recordEvent({ name: "request_saved", requestType: data.type, service: data.type === "quote" ? data.services.join(",") : null, source: data.source });
    // Email the team after the response is sent; the request is already safe in the database.
    after(() => notifyRequest(saved.id));
  }
  return json({ ok: true, ref: saved.ref });
}
