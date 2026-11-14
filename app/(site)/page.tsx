import { Hero } from "@/components/Hero";
import { ServiceCards } from "@/components/ServiceCards";
import { EyeTracker } from "@/components/EyeTracker";
import { Eye, Wave } from "@/components/Eye";
import { Contact } from "@/components/Contact";
import { Process } from "@/components/Process";
import { JsonLd } from "@/components/Prose";
import { WorkCard } from "@/components/Works";
import { getFaqs, getLinks, getServices, getWorks, wantsPreview, type Faq as FaqRow, type Service, type Work } from "@/lib/content";
import { reasons, roles, sectors } from "@/lib/site";

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
            اختر الخدمة اللي تحتاجها، أو خذ الفريق كامل.
          </p>
        </div>
        <ServiceCards services={services} />
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
        <ul className="works works--rail">
          {works.slice(0, 6).map((w) => (
            <WorkCard key={w.id} work={w} preview={preview} />
          ))}
        </ul>
      </div>
    </section>
  );
}

// One section answers "why us": the team-vs-one-person comparison, then the remaining reasons.
function Why() {
  return (
    <section id="why" className="why" aria-labelledby="why-title">
      <p className="ghost ghost--why" aria-hidden="true">
        WHY
      </p>
      <div className="wrap">
        <div className="why__top">
          <div className="why__copy">
            <h2 id="why-title" className="display display--md display--paper">
              ليش ماين ستريم؟
            </h2>
            <p className="why__lead">عين وحدة.. ولا تسع عيون؟</p>
            <p className="why__text">
              لو تعتمد على شخص واحد، تاخذ عين وحدة على نشاطك. مع ماين ستريم يشتغل لك فريق كامل، كل واحد متخصص في
              شغلته، وكلهم تحت سقف واحد.
            </p>
          </div>
          <div className="compare">
            <figure className="ledger ledger--one">
              <figcaption className="ledger__head">شخص واحد</figcaption>
              <div className="ledger__eyes ledger__eyes--one">
                <Eye className="ledger__eye" />
              </div>
              <p className="ledger__note">يحاول يسوي كل شي</p>
            </figure>
            <span className="compare__vs" aria-hidden="true" dir="ltr">
              VS
            </span>
            <figure className="ledger ledger--team">
              <figcaption className="ledger__head">فريق ماين ستريم</figcaption>
              <ul className="ledger__eyes">
                {roles.map((r) => (
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
    <section id="sectors" className="sectors" aria-labelledby="sectors-title">
      <div className="wrap sectors__row">
        <h2 id="sectors-title" className="sectors__title">
          نشتغل مع
        </h2>
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

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const preview = await wantsPreview(searchParams);
  const [services, works, faqs, links] = await Promise.all([getServices(preview), getWorks(preview), getFaqs(preview), getLinks()]);
  return (
    <>
      <span id="top" />
      <Hero />
      <Stream />
      <Watchlist works={works} preview={preview} />
      <Services services={services} />
      <Why />
      <Process />
      <Sectors />
      <Faq faqs={faqs} />
      <Contact links={links} services={services} />
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
