// Creates or resets an admin account. Public sign-up does not exist; this is the only way in for the first owner.
// Usage: npm run admin:create -- <username> "<name>" [owner|agent|editor]
// The password is read from ADMIN_PASSWORD, or generated and printed once.
import { randomBytes } from "node:crypto";
import { hashPassword } from "../lib/crypto";
import { sql } from "../lib/db";

const [rawUsername, name, role = "owner"] = process.argv.slice(2);
const username = (rawUsername ?? "").toLowerCase();
if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username) || !name || !["owner", "agent", "editor"].includes(role)) {
  console.error('usage: npm run admin:create -- <username> "<name>" [owner|agent|editor]  (username: a-z, 0-9, . _ -)');
  process.exit(1);
}
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
if (password.length < 12) {
  console.error("password must be at least 12 characters");
  process.exit(1);
}
// Re-running for an existing username resets its password (recovery path for a locked-out owner).
await sql`insert into users (username, name, role, password_hash)
          values (${username}, ${name}, ${role}, ${await hashPassword(password)})
          on conflict (username) do update set name = excluded.name, role = excluded.role, password_hash = excluded.password_hash,
            active = true, failed_logins = 0, locked_until = null`;
await sql`delete from sessions where user_id = (select id from users where username = ${username})`;
await sql`insert into audit_log (actor_name, action, entity, entity_id, meta)
          values ('CLI', 'user.created_or_reset', 'user', ${username}, ${sql.json({ role })})`;
console.log(`account ready: ${username} (${role})`);
if (generated) console.log(`temporary password (shown once, change it after signing in): ${password}`);
await sql.end();
