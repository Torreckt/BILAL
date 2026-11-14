import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import { env } from "./env";
import { randomToken, sha256 } from "./crypto";
import type { Role } from "./roles";
import { SESSION_COOKIE_PLAIN, SESSION_COOKIE_SECURE } from "./session-cookie";

export type SessionUser = { id: string; username: string; name: string; role: Role };

const COOKIE = env.secureCookies ? SESSION_COOKIE_SECURE : SESSION_COOKIE_PLAIN;
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

const sessionTokenHash = async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? sha256(token) : null;
};

/** Signs an account out everywhere; with `keepCurrent`, the browser making this request stays signed in. */
export async function endSessions(userId: string, { keepCurrent = false } = {}) {
  const keep = keepCurrent ? await sessionTokenHash() : null;
  await sql`delete from sessions where user_id = ${userId} and ${keep ? sql`token_hash <> ${keep}` : sql`true`}`;
}

/** The signed-in account, or null. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const hash = await sessionTokenHash();
  if (!hash) return null;
  const [row] = await sql<(SessionUser & { stale: boolean })[]>`
    select u.id, u.username, u.name, u.role,
           s.last_seen_at < now() - interval '1 minute' as stale
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${hash} and u.active and s.expires_at > now()
      and s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})`;
  if (!row) return null;
  if (row.stale) await sql`update sessions set last_seen_at = now() where token_hash = ${hash}`;
  return row;
});

/** Gate for admin pages and actions: signed in and holding one of the roles. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (roles.length && !roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}
