import { clientKey, consumeRateLimit } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/events";

const NAMES = new Set(["whatsapp_click"]);
const short = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null);

// Anonymous funnel events only: a name plus request type / service / source. No customer details are accepted.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !NAMES.has(body.name) || !(await consumeRateLimit(`evt:${await clientKey()}`, { limit: 60, windowSeconds: 600 }))) return new Response(null, { status: 204 });
  await recordEvent({ name: body.name, requestType: short(body.type, 20), service: short(body.service, 200), source: short(body.source, 200) });
  return new Response(null, { status: 204 });
}
