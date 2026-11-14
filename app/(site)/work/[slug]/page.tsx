import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/Contact";
import { JsonLd, breadcrumbs, orgRef } from "@/components/JsonLd";
import { Prose } from "@/components/Prose";
import { RelatedWorks, WorkMedia } from "@/components/Works";
import { getLinks, getService, getServices, getWork, getWorks, wantsPreview } from "@/lib/content";
import { env } from "@/lib/env";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = await getWork((await params).slug);
  if (!work) return {};
  const url = `/work/${work.slug}`;
  return {
    title: `${work.title} — ${work.category}`,
    description: work.summary,
    alternates: { canonical: url },
    openGraph: { title: work.title, description: work.summary, url, type: "article", images: work.cover ? [work.cover] : undefined },
  };
}

export default async function WorkPage({ params, searchParams }: Props) {
  const preview = await wantsPreview(searchParams);
  const work = await getWork((await params).slug, preview);
  if (!work) notFound();
  const [works, services, links, service] = await Promise.all([
    getWorks(preview),
    getServices(),
    getLinks(),
    work.service_slug ? getService(work.service_slug) : undefined,
  ]);
  const others = works.filter((w) => w.id !== work.id).slice(0, 3);
  const url = `${env.siteUrl}/work/${work.slug}`;

  return (
    <>
      {work.status === "draft" && <p className="draft-bar">معاينة مسودة: هذا العمل غير منشور للزوار.</p>}
      <article>
        <header className="page-head">
          <div className="wrap">
            <nav className="crumbs" aria-label="مسار الصفحة">
              <a href="/">الرئيسية</a>
              <a href="/work">أعمالنا</a>
              <span aria-current="page">{work.title}</span>
            </nav>
            <p className="tag tag--ink">{work.category}</p>
            <h1 className="display display--md">{work.title}</h1>
            <p className="lede page-head__lede">{work.summary}</p>
          </div>
        </header>

        <section className="section page-body">
          <div className="wrap case">
            <div className={`case__media ${work.media.length === 1 ? "case__media--single" : ""}`}>
              {work.media.map((m, i) => (
                <WorkMedia key={m.src} item={m} priority={i === 0} />
              ))}
            </div>
            <div className="case__text">
              <Prose text={work.body} />
              <dl className="case__facts">
                {work.client && (
                  <div>
                    <dt>العميل</dt>
                    <dd>{work.client}</dd>
                  </div>
                )}
                {service && (
                  <div>
                    <dt>الخدمة</dt>
                    <dd>
                      <a href={`/services/${service.slug}`}>{service.title}</a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
      </article>

      <RelatedWorks id="others-title" title="ملفات ثانية" works={others} preview={preview} />

      <Contact
        links={links}
        services={services}
        title="تبي شغل زي كذا؟"
        lede="اطلب عرض سعر أو اجتماع، ونرجع لك بتصور يناسب نشاطك."
        initialIntent="quote"
        initialService={service?.slug}
      />

      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "CreativeWork",
              name: work.title,
              description: work.summary,
              url,
              image: work.cover ? env.siteUrl + work.cover : undefined,
              creator: orgRef(),
            },
            breadcrumbs([
              { name: "أعمالنا", url: `${env.siteUrl}/work` },
              { name: work.title, url },
            ]),
          ],
        }}
      />
    </>
  );
}
