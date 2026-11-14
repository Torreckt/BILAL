// Dashboard reads and writes for site content and settings. Public, published-only reads live in lib/content.ts.
import type { MediaItem, Service, Settings, Work } from "../content";
import { sql } from "../db";

export const CONTENT_TABLES = { service: "services", work: "works", faq: "faqs" } as const;
export type ContentKind = keyof typeof CONTENT_TABLES;
export const isContentKind = (v: string): v is ContentKind => Object.hasOwn(CONTENT_TABLES, v);
/** Column values the dashboard writes; jsonb columns go through asJsonb. */
export type ContentRow = Record<string, string | number | boolean | null | string[] | ReturnType<typeof asJsonb>>;
type Table = (typeof CONTENT_TABLES)[ContentKind];

export async function getServiceById(id: string): Promise<Service | undefined> {
  const [row] = await sql<Service[]>`select * from services where id = ${id}`;
  return row;
}

export async function getWorkById(id: string): Promise<Work | undefined> {
  const [row] = await sql<Work[]>`select * from works where id = ${id}`;
  return row;
}

/** Slug → title for every service, drafts included (requests may name services that were later unpublished). */
export async function serviceTitles() {
  const rows = await sql<{ slug: string; title: string }[]>`select slug, title from services order by position`;
  return { list: rows, title: (slug: string) => rows.find((s) => s.slug === slug)?.title ?? slug };
}

export async function contentCounts() {
  const [row] = await sql<{ services: number; works: number; faqs: number; drafts: number }[]>`
    select (select count(*) from services where status = 'published')::int as services,
           (select count(*) from works where status = 'published')::int as works,
           (select count(*) from faqs where status = 'published')::int as faqs,
           ((select count(*) from services where status = 'draft') + (select count(*) from works where status = 'draft')
             + (select count(*) from faqs where status = 'draft'))::int as drafts`;
  return row;
}

/** Whether another row already uses this slug; `exceptId` is the row being edited (absent for a new one). */
export async function slugTaken(table: "services" | "works", slug: string, exceptId?: string) {
  const [row] = await sql`select 1 from ${sql(table)} where slug = ${slug} and ${exceptId ? sql`id <> ${exceptId}` : sql`true`}`;
  return !!row;
}

export class SlugTakenError extends Error {}

/**
 * Inserts a new row when `id` is undefined, otherwise updates that row; returns the row's id (undefined if the update
 * matched nothing).
 * A unique-slug violation (two editors saving the same slug at once) becomes a SlugTakenError.
 */
export async function saveContentRow(table: Table, id: string | undefined, row: ContentRow): Promise<string | undefined> {
  try {
    const [saved] = id
      ? await sql<{ id: string }[]>`update ${sql(table)} set ${sql(row)}, updated_at = now() where id = ${id} returning id`
      : await sql<{ id: string }[]>`insert into ${sql(table)} ${sql(row)} returning id`;
    return saved?.id;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new SlugTakenError("slug taken", { cause: e });
    throw e;
  }
}

/** Wraps a value so saveContentRow stores it in a jsonb column (e.g. a work's media list). */
export const asJsonb = (value: unknown) => sql.json(value as never);

export async function workMedia(id: string): Promise<MediaItem[] | undefined> {
  const [row] = await sql<{ media: MediaItem[] }[]>`select media from works where id = ${id}`;
  return row?.media;
}

export async function deleteContentRow(table: Table, id: string) {
  await sql`delete from ${sql(table)} where id = ${id}`;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await sql`insert into settings (key, value) values (${key}, ${asJsonb(value)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
