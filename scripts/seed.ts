// Loads the starting content (published) without touching rows that already exist. Usage: npm run db:seed
import { faqs, services, works } from "../db/seed-data";
import { sql } from "../lib/db";
import { defaultLinks } from "../lib/site";

let n = 0;
for (const [i, s] of services.entries()) {
  n += (await sql`insert into services ${sql({ ...s, status: "published", position: i })} on conflict (slug) do nothing`).count;
}
for (const [i, w] of works.entries()) {
  n += (await sql`insert into works ${sql({ ...w, media: sql.json(w.media) as never, status: "published", position: i })}
                  on conflict (slug) do nothing`).count;
}
if (!(await sql`select 1 from faqs limit 1`).length) {
  for (const [i, f] of faqs.entries()) n += (await sql`insert into faqs ${sql({ ...f, status: "published", position: i })}`).count;
}
await sql`insert into settings (key, value) values ('links', ${sql.json(defaultLinks)}), ('retention_days', '365')
          on conflict (key) do nothing`;
console.log(`seed: ${n} rows added`);
await sql.end();
