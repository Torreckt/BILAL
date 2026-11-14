import { after } from "next/server";
import { allow, clientKey } from "@/lib/auth";
import { sql } from "@/lib/db";
import { notifyRequest } from "@/lib/notify";
import { parseRequest, saveRequest } from "@/lib/requests";

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "بيانات غير صالحة" }, 400);
  }

  // Spam traps: a hidden field people never fill, and forms submitted faster than a person can type.
  // Bots get a normal-looking answer so they don't adapt.
  if (body.website || Number(body.elapsed) < 2500) return json({ ok: true, ref: "MS-000000" });

  const ip = await clientKey();
  if (!(await allow(`req:${ip}`, 5, 600)) || !(await allow(`req-day:${ip}`, 30, 86400))) {
    return json({ error: "أرسلت طلبات كثيرة. جرّب بعد شوي أو كلّمنا واتساب." }, 429);
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) return json({ errors: parsed.errors }, 422);
  const data = parsed.data;

  if (data.type === "quote") {
    const known = await sql<{ title: string }[]>`select title from services where status = 'published' and slug in ${sql(data.services)}`;
    if (known.length !== new Set(data.services).size) return json({ errors: { services: "اختر الخدمات من القائمة" } }, 422);
  }

  const saved = await saveRequest(data, ip);
  if (saved.created) {
    await sql`insert into events (name, request_type, service, source)
              values ('request_saved', ${data.type}, ${data.type === "quote" ? data.services.join(",") : null}, ${data.source})`;
    // Email the team after the response is sent; the request is already safe in the database.
    after(() => notifyRequest(saved.id));
  }
  return json({ ok: true, ref: saved.ref });
}
