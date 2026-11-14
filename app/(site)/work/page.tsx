import type { Metadata } from "next";
import { Contact } from "@/components/Contact";
import { WorkCard } from "@/components/Works";
import { getLinks, getServices, getWorks, wantsPreview } from "@/lib/content";

export const metadata: Metadata = {
  title: "أعمالنا",
  description: "نماذج من شغل ماين ستريم: تصوير، مونتاج، موشن جرافيك، هوية وتصميم. افتح أي عمل وشوف تفاصيله.",
  alternates: { canonical: "/work" },
  openGraph: { title: "أعمال ماين ستريم", url: "/work" },
};

export default async function WorkIndex({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const preview = await wantsPreview(searchParams);
  const [works, services, links] = await Promise.all([getWorks(preview), getServices(), getLinks()]);
  return (
    <>
      <section className="page-head">
        <p className="ghost ghost--page" aria-hidden="true" dir="ltr">
          WORK
        </p>
        <div className="wrap">
          <nav className="crumbs" aria-label="مسار الصفحة">
            <a href="/">الرئيسية</a>
            <span aria-current="page">أعمالنا</span>
          </nav>
          <h1 className="display display--md">قائمة المراقبة</h1>
          <p className="lede page-head__lede">شغل سويناه بعيوننا: تصوير، مونتاج، موشن، وهوية. افتح أي ملف وشوف التفاصيل.</p>
        </div>
      </section>
      <section className="section page-body">
        <div className="wrap">
          {works.length ? (
            <ul className="works">
              {works.map((w, i) => (
                <WorkCard key={w.id} work={w} preview={preview} priority={i === 0} />
              ))}
            </ul>
          ) : (
            <p className="lede">نجهّز ملفات أعمالنا للنشر. ارجع لنا قريب.</p>
          )}
        </div>
      </section>
      <Contact links={links} services={services} title="عجبك الشغل؟" lede="قول لنا وش تبي نسوي لك، ونرجع لك بتصور وعرض واضح." initialIntent="quote" />
    </>
  );
}
