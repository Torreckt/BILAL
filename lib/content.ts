import { cache } from "react";
import { sql } from "./db";

/** Content rows are drafts until an editor publishes them. */
export type PublishStatus = "draft" | "published";

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
  status: PublishStatus;
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
  status: PublishStatus;
  position: number;
  updated_at: Date;
};
export type Faq = { id: string; question: string; answer: string; status: PublishStatus; position: number };

// The public site only ever sees published rows; drafts are included only when the page asks for them (see lib/preview.ts).
const visible = (drafts: boolean) => (drafts ? sql`true` : sql`status = 'published'`);

export const getServices = cache(
  (drafts = false) => sql<Service[]>`select * from services where ${visible(drafts)} order by position, title`,
);
export const getService = cache(async (slug: string, drafts = false): Promise<Service | undefined> => {
  const [row] = await sql<Service[]>`select * from services where slug = ${slug} and ${visible(drafts)}`;
  return row;
});
export const getWorks = cache(
  (drafts = false) => sql<Work[]>`select * from works where ${visible(drafts)} order by position, updated_at desc`,
);
export const getWork = cache(async (slug: string, drafts = false): Promise<Work | undefined> => {
  const [row] = await sql<Work[]>`select * from works where slug = ${slug} and ${visible(drafts)}`;
  return row;
});
export const getFaqs = cache(
  (drafts = false) => sql<Faq[]>`select * from faqs where ${visible(drafts)} order by position, question`,
);
