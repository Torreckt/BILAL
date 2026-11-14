import type { MetadataRoute } from "next";
import { getServices, getWorks } from "@/lib/content";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Published pages only. Drafts, the dashboard and the API never appear here.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, works] = await Promise.all([getServices(), getWorks()]);
  const latest = (rows: { updated_at: Date }[]) => rows.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), new Date(0));
  return [
    { url: `${env.siteUrl}/`, lastModified: latest([...services, ...works]), priority: 1 },
    { url: `${env.siteUrl}/work`, lastModified: latest(works), priority: 0.8 },
    ...services.map((s) => ({ url: `${env.siteUrl}/services/${s.slug}`, lastModified: s.updated_at, priority: 0.9 })),
    ...works.map((w) => ({ url: `${env.siteUrl}/work/${w.slug}`, lastModified: w.updated_at, priority: 0.7 })),
    { url: `${env.siteUrl}/privacy`, priority: 0.2 },
  ];
}
