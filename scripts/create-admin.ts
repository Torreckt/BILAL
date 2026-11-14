// Creates or resets an admin account. Public sign-up does not exist; this is the only way in for the first owner.
// Usage: npm run admin:create -- <email> "<name>" [owner|agent|editor]
// The password is read from ADMIN_PASSWORD, or generated and printed once.
import { randomBytes } from "node:crypto";
import { hashPassword } from "../lib/crypto";
import { sql } from "../lib/db";

const [email, name, role = "owner"] = process.argv.slice(2);
if (!email || !name || !["owner", "agent", "editor"].includes(role)) {
  console.error('usage: npm run admin:create -- <email> "<name>" [owner|agent|editor]');
  process.exit(1);
}
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
if (password.length < 12) {
  console.error("password must be at least 12 characters");
  process.exit(1);
}
// Re-running for an existing email resets the password and the second factor (recovery path for a locked-out owner).
await sql`insert into users (email, name, role, password_hash)
          values (${email.toLowerCase()}, ${name}, ${role}, ${await hashPassword(password)})
          on conflict (email) do update set name = excluded.name, role = excluded.role, password_hash = excluded.password_hash,
            totp_secret = null, totp_enabled = false, active = true, failed_logins = 0, locked_until = null`;
await sql`delete from sessions where user_id = (select id from users where email = ${email.toLowerCase()})`;
await sql`insert into audit_log (actor_name, action, entity, entity_id, meta)
          values ('CLI', 'user.created_or_reset', 'user', ${email.toLowerCase()}, ${sql.json({ role })})`;
console.log(`account ready: ${email} (${role})`);
if (generated) console.log(`temporary password (shown once, change it after signing in): ${password}`);
await sql.end();
