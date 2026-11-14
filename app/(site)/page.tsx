import { Hero } from "@/components/Hero";
import { ServiceCards } from "@/components/ServiceCards";
import { EyeTracker } from "@/components/EyeTracker";
import { Eye, Wave } from "@/components/Eye";
import { ContactButton } from "@/components/ContactButton";
import { Contact } from "@/components/Contact";
import { JsonLd } from "@/components/Prose";
import { WorkCard } from "@/components/Works";
import { getFaqs, getLinks, getServices, getWorks, wantsPreview, type Faq as FaqRow, type Service, type Work } from "@/lib/content";
import { reasons, sectors, teamRoles } from "@/lib/site";

function Stream() {
  const phrase = (
    <>
      <span>نصنع الضجة.. وأنت تملك الأضواء</span>
      <Wave className="stream__wave" />
      <span dir="ltr" className="stream__latin">
        WE CREATE THE HYPE
      </span>
      <Wave className="stream__wave" />
      <span dir="ltr" className="stream__latin">
        YOU OWN THE SPOTLIGHT
      </span>
      <Wave className="stream__wave" />
    </>
  );
  return (
    <div className="stream" aria-hidden="true">
      {/* Two identical halves, each wider than any screen, so the loop never shows a gap. */}
      <div className="stream__track">
        {[0, 1].map((half) => (
          <div className="stream__run" key={half}>
            {phrase}
            {phrase}
            {phrase}
          </div>
        ))}
      </div>
    </div>
  );
}

function Services({ services }: { services: Service[] }) {
  return (
    <section id="services" className="section services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="services__intro">
          <h2 id="services-title" className="display display--md">
            وش نسوي لك؟
          </h2>
          <p className="lede">
            كل خدمة عندنا ملف مفتوح على نشاطك. نتابعه كل يوم، ونرسل لك آخر الشهر وش صار بالأرقام.
          </p>
          <ContactButton variant="ink" intent="inquiry">
            اسألنا عن خدمة
          </ContactButton>
        </div>
        <ServiceCards services={services} />
      </div>
    </section>
  );
}

function OneSalary() {
  return (
    <section id="team" className="salary" aria-labelledby="salary-title">
      <p className="ghost ghost--salary" aria-hidden="true">
        HYPE
      </p>
      <div className="wrap salary__grid">
        <div className="salary__copy">
          <h2 id="salary-title" className="display display--md display--paper">
            عين وحدة.. ولا تسع عيون؟
          </h2>
          <p className="salary__text">
            لو تعتمد على شخص واحد، تاخذ عين وحدة على نشاطك. مع ماين ستريم يشتغل لك فريق كامل، كل واحد
            متخصص في شغلته، وكلهم تحت سقف واحد.
          </p>
          <p className="tag tag--ink salary__tag">تصميم · محتوى · تصوير · إعلانات · نتائج</p>
        </div>

        <div className="salary__compare">
          <figure className="ledger ledger--one">
            <figcaption className="ledger__head">شخص واحد</figcaption>
            <div className="ledger__eyes ledger__eyes--one">
              <Eye className="ledger__eye" />
            </div>
            <p className="ledger__note">يحاول يسوي كل شي</p>
          </figure>
          <span className="salary__vs" aria-hidden="true" dir="ltr">
            VS
          </span>
          <figure className="ledger ledger--team">
            <figcaption className="ledger__head">فريق ماين ستريم</figcaption>
            <ul className="ledger__eyes">
              {teamRoles.map((r) => (
                <li key={r}>
                  <Eye className="ledger__eye" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="ledger__note">كل واحد متخصص في شغلته</p>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Watchlist({ works, preview }: { works: Work[]; preview: boolean }) {
  if (!works.length) return null;
  return (
    <section id="work" className="section watchlist" aria-labelledby="watch-title">
      <div className="wrap">
        <div className="watchlist__head">
          <div>
            <h2 id="watch-title" className="display display--md">
              قائمة المراقبة
            </h2>
            <p className="lede">شغل سويناه بعيوننا. افتح أي ملف وشوف التفاصيل.</p>
          </div>
          <a className="text-link" href="/work">
            كل الأعمال
          </a>
        </div>
        <ul className="works">
          {works.slice(0, 3).map((w) => (
            <WorkCard key={w.id} work={w} preview={preview} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { t: "ترسل طلبك", d: "من النموذج أو واتساب. نتواصل معك ونحدد موعد اجتماع يناسبك." },
    { t: "نفهم نشاطك", d: "نجلس معك، نشوف جمهورك ومنافسينك، ونبني خطة الشهر." },
    { t: "نشغّل الضجة", d: "الفريق يبدأ: محتوى، تصوير، إعلانات. وآخر الشهر تقرير أداء واضح." },
  ];
  return (
    <section id="process" className="section process" aria-labelledby="process-title">
      <p className="ghost ghost--process" aria-hidden="true">
        ON AIR
      </p>
      <div className="wrap">
        <div className="process__head">
          <h2 id="process-title" className="display display--md">
            كيف نشتغل
          </h2>
          <p className="tag tag--ink">من أول رسالة.. لأول ضجة</p>
        </div>
        <ol className="process__line">
          {steps.map((s, i) => (
            <li key={s.t} className="process__step">
              <Wave className="process__wave" />
              <span className="process__num" dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section id="why" className="why" aria-labelledby="why-title">
      <p className="ghost ghost--why" aria-hidden="true">
        WHY
      </p>
      <div className="wrap">
        <div className="why__head">
          <h2 id="why-title" className="display display--md display--paper">
            ليش ماين ستريم؟
          </h2>
          <p className="tag tag--red">WATCH US</p>
        </div>
        <ol className="why__list">
          {reasons.map((r, i) => (
            <li key={r.title} className="why__item">
              <span className="why__num" dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Sectors() {
  return (
    <section id="sectors" className="section sectors" aria-labelledby="sectors-title">
      <div className="wrap sectors__grid">
        <div>
          <h2 id="sectors-title" className="display display--md">
            نشتغل مع
          </h2>
          <p className="lede sectors__lede">أي نشاط يبي يكبر، من الكوفي الصغير للشركة. هذي بعض القطاعات اللي نخدمها:</p>
        </div>
        <ul className="sectors__list">
          {sectors.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq({ faqs }: { faqs: FaqRow[] }) {
  if (!faqs.length) return null;
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <h2 id="faq-title" className="display display--md">
          الأسئلة الشائعة
        </h2>
        <div className="faq__list">
          {faqs.map((f) => (
            <details key={f.id} className="faq__item">
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Finale() {
  return (
    <section className="finale" aria-labelledby="finale-title">
      <div className="finale__dots" aria-hidden="true" />
      <div className="wrap finale__inner">
        <Wave className="finale__wave" />
        <h2 id="finale-title" className="display finale__title">
          انت استرخ.. وخلي الإبداع علينا
        </h2>
        <ContactButton variant="paper" size="lg">
          اطلب اجتماعك الآن
        </ContactButton>
        <p className="tag tag--paper finale__tag" dir="ltr">
          WATCH US.
        </p>
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const preview = await wantsPreview(searchParams);
  const [services, works, faqs, links] = await Promise.all([getServices(preview), getWorks(preview), getFaqs(preview), getLinks()]);
  return (
    <>
      <span id="top" />
      <Hero />
      <Stream />
      <Services services={services} />
      <Why />
      <OneSalary />
      <Sectors />
      <Watchlist works={works} preview={preview} />
      <Process />
      <Contact links={links} services={services} />
      <Faq faqs={faqs} />
      <Finale />
      <EyeTracker />
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      )}
    </>
  );
}
