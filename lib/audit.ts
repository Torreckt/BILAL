import { sql } from "./db";

export type AuditEntry = { id: string; actor_name: string | null; action: string; meta: Record<string, string>; created_at: Date };

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

export const recentAudit = (limit: number) =>
  sql<AuditEntry[]>`select id, actor_name, action, meta, created_at from audit_log order by created_at desc limit ${limit}`;

export const auditFor = (entity: string, entityId: string) =>
  sql<AuditEntry[]>`select id, actor_name, action, meta, created_at from audit_log
                    where entity = ${entity} and entity_id = ${entityId} order by created_at desc`;
