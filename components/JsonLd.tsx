import { env } from "@/lib/env";

/** Structured data for search engines. The schema.org context is added here, so pages pass only their own nodes. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ "@context": "https://schema.org", ...data });
  // Escaping "<" keeps any text from the dashboard from closing the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }} />;
}

/** Reference to the agency node declared in the site layout. */
export const orgRef = () => ({ "@id": `${env.siteUrl}/#org` });

/** BreadcrumbList starting at the home page; `trail` is the path after it, each with an absolute URL. */
export const breadcrumbs = (trail: { name: string; url: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "الرئيسية", url: env.siteUrl }, ...trail].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});
