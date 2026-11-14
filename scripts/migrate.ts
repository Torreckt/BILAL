// Applies db/migrations/*.sql in order, each once. Usage: npm run db:migrate
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../lib/db";

const dir = join(process.cwd(), "db/migrations");
await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
const done = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));
for (const name of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(name)) continue;
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(join(dir, name), "utf8"));
    await tx`insert into schema_migrations (name) values (${name})`;
  });
  console.log(`applied ${name}`);
}
console.log("migrations up to date");
await sql.end();
