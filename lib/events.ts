// Anonymous funnel events: a name plus request type / service / source. Never customer details.
import { sql } from "./db";

type FunnelEvent = { name: string; requestType?: string | null; service?: string | null; source?: string | null };

export async function recordEvent({ name, requestType = null, service = null, source = null }: FunnelEvent) {
  await sql`insert into events (name, request_type, service, source) values (${name}, ${requestType}, ${service}, ${source})`;
}

/** Event counts by name over the last `days` days. */
export async function eventCounts(days: number) {
  const rows = await sql<{ name: string; n: number }[]>`
    select name, count(*)::int as n from events where created_at > now() - make_interval(days => ${days}) group by name`;
  return (name: string) => rows.find((r) => r.name === name)?.n ?? 0;
}
