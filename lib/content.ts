import { cache } from "react";
import { sql } from "./db";
import { CONTENT_ROLES, getSession } from "./auth";
import { defaultLinks, type Links } from "./site";

export type Service = {
  id: string;
  slug: string;
  code: string;
  title: string;
  line: string;
  items: string[];
  summary: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  position: number;
  updated_at: Date;
};
export type MediaItem = { type: "image" | "video"; src: string; poster?: string; w: number; h: number; alt?: string };
export type Work = {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string | null;
  summary: string;
  body: string;
  service_slug: string | null;
  cover: string | null;
  media: MediaItem[];
  status: "draft" | "published";
  position: number;
  updated_at: Date;
};
export type Faq = { id: string; question: string; answer: string; status: "draft" | "published"; position: number };

// The public site only ever sees published rows; drafts need a signed-in editor asking for a preview.
const visible = (drafts: boolean) => (drafts ? sql`true` : sql`status = 'published'`);

export const getServices = cache(
  (drafts = false) => sql<Service[]>`select * from services where ${visible(drafts)} order by position, title`,
);
export const getService = cache(async (slug: string, drafts = false) => {
  const [row] = await sql<Service[]>`select * from services where slug = ${slug} and ${visible(drafts)}`;
  return row;
});
export const getWorks = cache(
  (drafts = false) => sql<Work[]>`select * from works where ${visible(drafts)} order by position, updated_at desc`,
);
export const getWork = cache(async (slug: string, drafts = false) => {
  const [row] = await sql<Work[]>`select * from works where slug = ${slug} and ${visible(drafts)}`;
  return row;
});
export const getFaqs = cache(
  (drafts = false) => sql<Faq[]>`select * from faqs where ${visible(drafts)} order by position, question`,
);

/** How many of these slugs are published services (to reject quote requests naming unknown ones). */
export async function publishedServiceCount(slugs: string[]) {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from services where status = 'published' and slug in ${sql(slugs)}`;
  return n;
}

export const getSetting = cache(async <T>(key: string, fallback: T): Promise<T> => {
  const [row] = await sql<{ value: T }[]>`select value from settings where key = ${key}`;
  return row ? row.value : fallback;
});
export const getLinks = async (): Promise<Links> => ({ ...defaultLinks, ...(await getSetting<Partial<Links>>("links", {})) });

/** True when the URL asks for a preview and the visitor is a signed-in owner or editor. */
export async function wantsPreview(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  if ((await searchParams).preview !== "1") return false;
  const user = await getSession();
  return !!user?.mfa_ok && CONTENT_ROLES.includes(user.role);
}
