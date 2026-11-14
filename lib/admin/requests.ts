// Dashboard queries for customer requests. Public submission lives in lib/requests.ts.
import { sql } from "../db";
import { isContactIntent, isRequestStatus, type ContactIntent, type RequestStatus } from "../intents";
import type { RequestRow } from "../requests";
import { isIsoDate, isUuid } from "../validate";

// Follow-up rule: new for over a day, or open with no change for three days. Expects the requests table aliased as r.
const needsFollowUp = sql`((r.status = 'new' and r.created_at < now() - interval '1 day')
  or (r.status not in ('new', 'closed') and r.updated_at < now() - interval '3 days'))`;

export type RequestStats = { fresh: number; follow: number; open: number; failed: number; mine: number };

export async function requestStats(userId: string) {
  const [stats] = await sql<RequestStats[]>`
    select count(*) filter (where r.status = 'new')::int as fresh,
           count(*) filter (where ${needsFollowUp})::int as follow,
           count(*) filter (where r.status <> 'closed')::int as open,
           count(*) filter (where r.notify_status = 'failed')::int as failed,
           count(*) filter (where r.assignee_id = ${userId} and r.status <> 'closed')::int as mine
    from requests r`;
  return stats;
}

export const recentRequests = (limit: number) =>
  sql<{ id: string; ref: string; type: ContactIntent; status: RequestStatus; name: string; created_at: Date }[]>`
    select id, ref, type, status, name, created_at from requests order by created_at desc limit ${limit}`;

export async function countNewRequests() {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from requests where status = 'new'`;
  return n;
}

/** The filters the requests page accepts in its query string; anything malformed is ignored. */
export type RequestFilters = {
  q?: string;
  type?: ContactIntent;
  status?: RequestStatus;
  service?: string;
  assignee?: string;
  from?: string;
  to?: string;
  open?: string;
  notify?: string;
  follow?: string;
};

const FILTER_KEYS = ["q", "service", "assignee", "from", "to", "open", "notify", "follow"] as const;

/** Picks the known filters out of an untrusted query string; unknown keys and invalid type/status values are dropped. */
export function parseRequestFilters(sp: Record<string, string | undefined>): RequestFilters {
  const filters: RequestFilters = {};
  for (const key of FILTER_KEYS) if (sp[key]) filters[key] = sp[key];
  if (sp.type && isContactIntent(sp.type)) filters.type = sp.type;
  if (sp.status && isRequestStatus(sp.status)) filters.status = sp.status;
  return filters;
}

export type RequestListRow = {
  id: string; ref: string; type: ContactIntent; status: RequestStatus; name: string; business: string | null;
  services: string[]; created_at: Date; assignee: string | null; notify_status: string;
};

export async function listRequests(f: RequestFilters, page: number, pageSize: number) {
  const like = f.q ? `%${f.q.slice(0, 80).replace(/[%_\\]/g, "\\$&")}%` : null;
  const where = sql`
    ${like ? sql`(r.name ilike ${like} or r.ref ilike ${like} or r.phone ilike ${like} or r.email ilike ${like} or r.business ilike ${like})` : sql`true`}
    and ${f.type ? sql`r.type = ${f.type}` : sql`true`}
    and ${f.status ? sql`r.status = ${f.status}` : sql`true`}
    and ${f.service ? sql`${f.service} = any(r.services)` : sql`true`}
    and ${isUuid(f.assignee) ? sql`r.assignee_id = ${f.assignee}` : f.assignee === "none" ? sql`r.assignee_id is null` : sql`true`}
    and ${isIsoDate(f.from) ? sql`r.created_at >= (${f.from}::date at time zone 'Asia/Riyadh')` : sql`true`}
    and ${isIsoDate(f.to) ? sql`r.created_at < ((${f.to}::date + 1) at time zone 'Asia/Riyadh')` : sql`true`}
    and ${f.open ? sql`r.status <> 'closed'` : sql`true`}
    and ${f.notify === "failed" ? sql`r.notify_status = 'failed'` : sql`true`}
    and ${f.follow ? needsFollowUp : sql`true`}`;
  const [rows, [{ total }]] = await Promise.all([
    sql<RequestListRow[]>`
      select r.id, r.ref, r.type, r.status, r.name, r.business, r.services, r.created_at, r.notify_status, u.name as assignee
      from requests r left join users u on u.id = r.assignee_id
      where ${where} order by r.created_at desc limit ${pageSize} offset ${(page - 1) * pageSize}`,
    sql<{ total: number }[]>`select count(*)::int as total from requests r where ${where}`,
  ]);
  return { rows, total };
}

export async function getRequest(id: string): Promise<RequestRow | undefined> {
  const [row] = await sql<RequestRow[]>`select * from requests where id = ${id}`;
  return row;
}

export const requestNotes = (requestId: string) =>
  sql<{ id: string; body: string; created_at: Date; author: string | null }[]>`
    select n.id, n.body, n.created_at, u.name as author from request_notes n left join users u on u.id = n.author_id
    where n.request_id = ${requestId} order by n.created_at desc`;

/** The fields an update needs to validate a change against. */
export async function requestWorkflowState(id: string) {
  const [row] = await sql<{ type: ContactIntent; status: RequestStatus; assignee_id: string | null }[]>`
    select type, status, assignee_id from requests where id = ${id}`;
  return row;
}

export async function setRequestStatus(id: string, status: RequestStatus) {
  await sql`update requests set status = ${status}, updated_at = now(),
            closed_at = ${status === "closed" ? sql`now()` : null} where id = ${id}`;
}

export async function assignRequest(id: string, assigneeId: string | null) {
  await sql`update requests set assignee_id = ${assigneeId}, updated_at = now() where id = ${id}`;
}

export async function addRequestNote(requestId: string, authorId: string, body: string) {
  await sql`insert into request_notes (request_id, author_id, body) values (${requestId}, ${authorId}, ${body})`;
  await sql`update requests set updated_at = now() where id = ${requestId}`;
}

/** Deletes the request and everything attached to it; returns its reference, or undefined if it was already gone. */
export async function deleteRequest(id: string) {
  const [row] = await sql<{ ref: string }[]>`delete from requests where id = ${id} returning ref`;
  return row?.ref;
}

export async function requestNotifyStatus(id: string) {
  const [row] = await sql<{ notify_status: string }[]>`select notify_status from requests where id = ${id}`;
  return row?.notify_status;
}
