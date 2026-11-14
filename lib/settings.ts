// Values the dashboard stores in the settings table (contact links, notification email, retention), read and written by key.
import { cache } from "react";
import { sql } from "./db";
import { defaultLinks, type Links } from "./site";

export type Settings = { links: Partial<Links>; notify_email: string; retention_days: number };

/** A stored setting, or the fallback when it is missing or not the expected kind of value. */
export const getSetting = cache(async <K extends keyof Settings>(key: K, fallback: Settings[K]): Promise<Settings[K]> => {
  const [row] = await sql<{ value: unknown }[]>`select value from settings where key = ${key}`;
  const value = row?.value;
  const sameKind = typeof value === typeof fallback && (typeof value !== "object" || (value !== null && !Array.isArray(value)));
  return sameKind ? (value as Settings[K]) : fallback;
});

export const getLinks = async (): Promise<Links> => ({ ...defaultLinks, ...(await getSetting("links", {})) });

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await sql`insert into settings (key, value) values (${key}, ${sql.json(value as never)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
