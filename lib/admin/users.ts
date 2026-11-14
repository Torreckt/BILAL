// Dashboard accounts: sign-in bookkeeping, the second step, and owner-only account management.
// Session rows themselves are handled in lib/auth.ts.
import type { Role } from "../auth";
import { sql } from "../db";

export const ROLES: Role[] = ["owner", "agent", "editor"];
const MAX_FAILED_LOGINS = 5;

export type LoginCandidate = { id: string; name: string; password_hash: string; locked: boolean; failed_logins: number };

export async function findActiveUserByEmail(email: string) {
  const [row] = await sql<LoginCandidate[]>`
    select id, name, password_hash, failed_logins, coalesce(locked_until > now(), false) as locked
    from users where email = ${email} and active`;
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

export async function totpState(userId: string) {
  const [row] = await sql<{ totp_secret: string | null; totp_last_step: string }[]>`
    select totp_secret, totp_last_step from users where id = ${userId}`;
  return { secret: row.totp_secret, lastStep: Number(row.totp_last_step) };
}

/** Marks a code's time step as used (each code works once) and turns the second step on. */
export async function acceptTotpStep(userId: string, step: number) {
  await sql`update users set totp_enabled = true, totp_last_step = ${step} where id = ${userId}`;
}

export async function passwordHash(userId: string) {
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${userId}`;
  return row.password_hash;
}

/** Sets a new password; also lifts any lockout, since an owner resetting it is the recovery path. */
export async function setPasswordHash(userId: string, hash: string) {
  await sql`update users set password_hash = ${hash}, failed_logins = 0, locked_until = null where id = ${userId}`;
}

export type UserRow = { id: string; email: string; name: string; role: Role; active: boolean; totp_enabled: boolean };

export const listUsers = () =>
  sql<UserRow[]>`select id, email, name, role, active, totp_enabled from users order by created_at`;

/** Active accounts that can be assigned requests. */
export const listRequestStaff = () =>
  sql<{ id: string; name: string }[]>`select id, name from users where role in ('owner', 'agent') and active order by name`;

export async function requestStaffName(userId: string) {
  const [row] = await sql<{ name: string }[]>`select name from users where id = ${userId} and active and role in ('owner', 'agent')`;
  return row?.name;
}

/** Creates an account; returns its id, or undefined when the email is already registered. */
export async function insertUser(email: string, name: string, role: Role, hash: string) {
  const [row] = await sql<{ id: string }[]>`
    insert into users (email, name, role, password_hash) values (${email}, ${name}, ${role}, ${hash})
    on conflict (email) do nothing returning id`;
  return row?.id;
}

export async function getUser(id: string) {
  const [row] = await sql<{ role: Role; active: boolean; email: string }[]>`select role, active, email from users where id = ${id}`;
  return row;
}

export async function setRole(id: string, role: Role) {
  await sql`update users set role = ${role} where id = ${id}`;
}

export async function toggleActive(id: string) {
  await sql`update users set active = not active where id = ${id}`;
}

export async function resetTotp(id: string) {
  await sql`update users set totp_secret = null, totp_enabled = false, totp_last_step = 0 where id = ${id}`;
}
