import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/Contact";
import { ContactButton } from "@/components/ContactButton";
import { JsonLd, Prose } from "@/components/Prose";
import { ServiceIcon } from "@/components/ServiceCards";
import { WorkCard } from "@/components/Works";
import { getLinks, getService, getServices, getWorks, wantsPreview } from "@/lib/content";
import { env } from "@/lib/env";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService((await params).slug);
  if (!service) return {};
  const title = service.seo_title || service.title;
  const description = service.seo_description || service.summary;
  const url = `/services/${service.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "article" } };
}

export default async function ServicePage({ params, searchParams }: Props) {
  const preview = await wantsPreview(searchParams);
  const service = await getService((await params).slug, preview);
  if (!service) notFound();
  const [services, works, links] = await Promise.all([getServices(preview), getWorks(preview), getLinks()]);
  const related = works.filter((w) => w.service_slug === service.slug).slice(0, 3);
  const others = services.filter((s) => s.slug !== service.slug);
  const url = `${env.siteUrl}/services/${service.slug}`;

  return (
    <>
      {service.status === "draft" && <p className="draft-bar">معاينة مسودة: هذي الصفحة غير منشورة للزوار.</p>}
      <section className="page-head">
        <p className="ghost ghost--page" aria-hidden="true" dir="ltr">
          {service.code}
        </p>
        <div className="wrap">
          <nav className="crumbs" aria-label="مسار الصفحة">
            <a href="/">الرئيسية</a>
            <a href="/#services">الخدمات</a>
            <span aria-current="page">{service.title}</span>
          </nav>
          <ServiceIcon slug={service.slug} className="page-head__icon" />
          <h1 className="display display--md">{service.title}</h1>
          <p className="page-head__line">{service.line}</p>
          {service.summary && <p className="lede page-head__lede">{service.summary}</p>}
          <div className="page-head__actions">
            <ContactButton intent="quote" size="lg">
              اطلب عرض سعر
            </ContactButton>
            <ContactButton intent="meeting" variant="ink" size="lg">
              اطلب اجتماع
            </ContactButton>
          </div>
        </div>
      </section>

      <section className="section page-body">
        <div className="wrap page-body__grid">
          <Prose text={service.body} />
          <aside className="includes" aria-labelledby="includes-title">
            <h2 id="includes-title">باختصار</h2>
            <ul>
              {service.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ContactButton intent="quote">اطلب عرض سعر</ContactButton>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section watchlist" aria-labelledby="related-title">
          <div className="wrap">
            <div className="watchlist__head">
              <h2 id="related-title" className="display display--md">
                من شغلنا
              </h2>
              <a className="text-link" href="/work">
                كل الأعمال
              </a>
            </div>
            <ul className="works">
              {related.map((w) => (
                <WorkCard key={w.id} work={w} preview={preview} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <Contact
        links={links}
        services={services}
        initialIntent="quote"
        initialService={service.slug}
        title="اطلب عرض سعر"
        lede={`الخدمة محددة لك جاهزة: ${service.title}. اوصف احتياجك ويرد عليك الفريق بعرض واضح.`}
      />

      <section className="section more" aria-labelledby="more-title">
        <div className="wrap">
          <h2 id="more-title" className="more__title">
            خدمات ثانية تكمّلها
          </h2>
          <ul className="more__list">
            {others.map((s) => (
              <li key={s.slug}>
                <a href={`/services/${s.slug}`}>{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: service.title,
              description: service.seo_description || service.summary,
              url,
              areaServed: "SA",
              provider: { "@id": `${env.siteUrl}/#org` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "الرئيسية", item: env.siteUrl },
                { "@type": "ListItem", position: 2, name: service.title, item: url },
              ],
            },
          ],
        }}
      />
    </>
  );
}
