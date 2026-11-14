// Deletes closed requests older than the retention period (dashboard → settings; default 365 days), plus expired
// sessions and old rate-limit counters. Run daily from cron: npm run retention
import { sql } from "../lib/db";

const [row] = await sql<{ value: number }[]>`select value from settings where key = 'retention_days'`;
const days = Number(row?.value ?? 365);
const removed = days > 0
  ? await sql`delete from requests where status = 'closed' and closed_at < now() - make_interval(days => ${days}) returning id`
  : [];
if (removed.length) {
  await sql`insert into audit_log (actor_name, action, entity, meta)
            values ('retention', 'requests.purged', 'request', ${sql.json({ count: removed.length, days })})`;
}
await sql`delete from sessions where expires_at < now()`;
await sql`delete from rate_limits where bucket < now() - interval '2 days'`;
console.log(`retention: removed ${removed.length} closed requests older than ${days} days`);
await sql.end();
