import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import { env } from "./env";
import { fingerprint, randomToken, sha256 } from "./crypto";

export type Role = "owner" | "agent" | "editor";
export type SessionUser = { id: string; email: string; name: string; role: Role; totp_enabled: boolean; mfa_ok: boolean };

// What each role may do. Every server action and page checks this on the server.
export const roleLabels: Record<Role, string> = { owner: "مالك", agent: "مسؤول متابعة", editor: "محرر محتوى" };
export const REQUEST_ROLES: Role[] = ["owner", "agent"];
export const CONTENT_ROLES: Role[] = ["owner", "editor"];

const COOKIE = env.secureCookies ? "__Host-ms_session" : "ms_session";
const ABSOLUTE_HOURS = 12;
const IDLE_MINUTES = 120;

export async function createSession(userId: string) {
  const token = randomToken();
  await sql`insert into sessions (token_hash, user_id, expires_at)
            values (${sha256(token)}, ${userId}, now() + make_interval(hours => ${ABSOLUTE_HOURS}))`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_HOURS * 3600,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${sha256(token)}`;
  jar.delete(COOKIE);
}

export const sessionTokenHash = async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? sha256(token) : null;
};

/** The signed-in account, or null. Password alone gives mfa_ok=false, which opens nothing but the MFA step. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const hash = await sessionTokenHash();
  if (!hash) return null;
  const [row] = await sql<(SessionUser & { stale: boolean })[]>`
    select u.id, u.email, u.name, u.role, u.totp_enabled, s.mfa_ok,
           s.last_seen_at < now() - interval '1 minute' as stale
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${hash} and u.active and s.expires_at > now()
      and s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})`;
  if (!row) return null;
  if (row.stale) await sql`update sessions set last_seen_at = now() where token_hash = ${hash}`;
  return row;
});

/** Gate for admin pages and actions: signed in, passed MFA, and holding one of the roles. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (!user.mfa_ok) redirect("/admin/mfa");
  if (roles.length && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}

export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  return fingerprint(ip);
}

/** Fixed-window counter in the database, so limits hold across restarts and instances. */
export async function allow(key: string, limit: number, windowSeconds: number) {
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limits (key, bucket)
    values (${key}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}))
    on conflict (key, bucket) do update set count = rate_limits.count + 1
    returning count`;
  // Old counters are cleared now and then, so the table stays small even without the daily retention job.
  if (Math.random() < 0.02) await sql`delete from rate_limits where bucket < now() - interval '2 days'`;
  return row.count <= limit;
}

export async function audit(
  actor: { id: string; name: string } | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {},
) {
  await sql`insert into audit_log (actor_id, actor_name, action, entity, entity_id, meta)
            values (${actor?.id ?? null}, ${actor?.name ?? null}, ${action}, ${entity}, ${entityId}, ${sql.json(meta as never)})`;
}
