import { headers } from "next/headers";
import { fingerprint } from "./crypto";
import { sql } from "./db";

/** A keyed hash of the visitor's IP, so limits and stored fingerprints never hold the raw address. */
export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  return fingerprint(ip);
}

/**
 * Records one attempt against `key` and returns whether it is still within `limit` for the current window.
 * Fixed-window counter in the database, so limits hold across restarts and instances.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limits (key, bucket)
    values (${key}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}))
    on conflict (key, bucket) do update set count = rate_limits.count + 1
    returning count`;
  // Old counters are cleared now and then, so the table stays small even without the daily retention job.
  if (Math.random() < 0.02) await sql`delete from rate_limits where bucket < now() - interval '2 days'`;
  return row.count <= limit;
}
