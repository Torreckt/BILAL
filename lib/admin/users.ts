// Dashboard accounts: sign-in bookkeeping and owner-only account management. Staff sign in with a username the owner creates.
// Session rows themselves are handled in lib/auth.ts.
import { REQUEST_ROLES, type Role } from "../roles";
import { sql } from "../db";

const MAX_FAILED_LOGINS = 5;

export type LoginCandidate = { id: string; name: string; password_hash: string; locked: boolean; failed_logins: number };

export async function findActiveUserByUsername(username: string): Promise<LoginCandidate | undefined> {
  const [row] = await sql<LoginCandidate[]>`
    select id, name, password_hash, failed_logins, coalesce(locked_until > now(), false) as locked
    from users where username = ${username} and active`;
  return row;
}

/**
 * Counts a wrong password; the fifth in a row locks the account for 15 minutes. Returns true when it just locked.
 * One atomic update, so parallel attempts can't overwrite each other's count.
 */
export async function recordFailedLogin(userId: string) {
  const [row] = await sql<{ locked: boolean }[]>`
    update users set
      failed_logins = case when failed_logins + 1 >= ${MAX_FAILED_LOGINS} then 0 else failed_logins + 1 end,
      locked_until = case when failed_logins + 1 >= ${MAX_FAILED_LOGINS} then now() + interval '15 minutes' else null end
    where id = ${userId}
    returning locked_until is not null as locked`;
  return !!row?.locked;
}

export async function clearFailedLogins(userId: string) {
  await sql`update users set failed_logins = 0, locked_until = null where id = ${userId}`;
}

export async function getPasswordHash(userId: string): Promise<string | undefined> {
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${userId}`;
  return row?.password_hash;
}

/** Sets a new password; also lifts any lockout, since an owner resetting it is the recovery path. */
export async function setPasswordHash(userId: string, hash: string) {
  await sql`update users set password_hash = ${hash}, failed_logins = 0, locked_until = null where id = ${userId}`;
}

export type UserRow = { id: string; username: string; name: string; role: Role; active: boolean };

export const listUsers = () =>
  sql<UserRow[]>`select id, username, name, role, active from users order by created_at`;

/** Active accounts that can be assigned requests. */
export const listRequestStaff = () =>
  sql<{ id: string; name: string }[]>`select id, name from users where role in ${sql(REQUEST_ROLES)} and active order by name`;

export async function requestStaffName(userId: string) {
  const [row] = await sql<{ name: string }[]>`select name from users where id = ${userId} and active and role in ${sql(REQUEST_ROLES)}`;
  return row?.name;
}

/** Creates an account; returns its id, or undefined when the username is already taken. */
export async function insertUser({ username, name, role, passwordHash }: { username: string; name: string; role: Role; passwordHash: string }) {
  const [row] = await sql<{ id: string }[]>`
    insert into users (username, name, role, password_hash) values (${username}, ${name}, ${role}, ${passwordHash})
    on conflict (username) do nothing returning id`;
  return row?.id;
}

export async function getUser(id: string): Promise<{ role: Role; active: boolean; username: string } | undefined> {
  const [row] = await sql<{ role: Role; active: boolean; username: string }[]>`select role, active, username from users where id = ${id}`;
  return row;
}

export async function setRole(id: string, role: Role) {
  await sql`update users set role = ${role} where id = ${id}`;
}

export async function setActive(id: string, active: boolean) {
  await sql`update users set active = ${active} where id = ${id}`;
}
