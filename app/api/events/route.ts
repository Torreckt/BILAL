import { clientKey, consumeRateLimit } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/events";

const NAMES = new Set(["whatsapp_click"]);
const short = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null);

// Anonymous funnel events only: a name plus request type / service / source. No customer details are accepted.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !NAMES.has(body.name) || !(await consumeRateLimit(`evt:${await clientKey()}`, 60, 600))) return new Response(null, { status: 204 });
  await recordEvent(body.name, short(body.type, 20), short(body.service, 200), short(body.source, 200));
  return new Response(null, { status: 204 });
}
