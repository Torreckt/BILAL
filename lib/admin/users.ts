// Dashboard accounts: sign-in bookkeeping and owner-only account management. Staff sign in with a username the owner creates.
// Session rows themselves are handled in lib/auth.ts.
import type { Role } from "../auth";
import { sql } from "../db";

export const ROLES: Role[] = ["owner", "agent", "editor"];
const MAX_FAILED_LOGINS = 5;

export type LoginCandidate = { id: string; name: string; password_hash: string; locked: boolean; failed_logins: number };

export async function findActiveUserByUsername(username: string) {
  const [row] = await sql<LoginCandidate[]>`
    select id, name, password_hash, failed_logins, coalesce(locked_until > now(), false) as locked
    from users where username = ${username} and active`;
  return row;
}

/** Counts a wrong password; the fifth in a row locks the account for 15 minutes. Returns true when it just locked. */
export async function recordFailedLogin(user: LoginCandidate) {
  const lock = user.failed_logins + 1 >= MAX_FAILED_LOGINS;
  await sql`update users set failed_logins = ${lock ? 0 : user.failed_logins + 1},
            locked_until = ${lock ? sql`now() + interval '15 minutes'` : null} where id = ${user.id}`;
  return lock;
}

export async function clearFailedLogins(userId: string) {
  await sql`update users set failed_logins = 0, locked_until = null where id = ${userId}`;
}

export async function passwordHash(userId: string) {
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${userId}`;
  return row.password_hash;
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
  sql<{ id: string; name: string }[]>`select id, name from users where role in ('owner', 'agent') and active order by name`;

export async function requestStaffName(userId: string) {
  const [row] = await sql<{ name: string }[]>`select name from users where id = ${userId} and active and role in ('owner', 'agent')`;
  return row?.name;
}

/** Creates an account; returns its id, or undefined when the username is already taken. */
export async function insertUser(username: string, name: string, role: Role, hash: string) {
  const [row] = await sql<{ id: string }[]>`
    insert into users (username, name, role, password_hash) values (${username}, ${name}, ${role}, ${hash})
    on conflict (username) do nothing returning id`;
  return row?.id;
}

export async function getUser(id: string) {
  const [row] = await sql<{ role: Role; active: boolean; username: string }[]>`select role, active, username from users where id = ${id}`;
  return row;
}

export async function setRole(id: string, role: Role) {
  await sql`update users set role = ${role} where id = ${id}`;
}

export async function toggleActive(id: string) {
  await sql`update users set active = not active where id = ${id}`;
}
