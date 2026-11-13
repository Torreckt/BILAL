import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ServiceCards } from "@/components/ServiceCards";
import { EyeTracker } from "@/components/EyeTracker";
import { Eye, Wave } from "@/components/Eye";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Footer } from "@/components/Footer";
import { QuoteForm } from "@/components/QuoteForm";
import { faqs, reasons, roles, sectors } from "@/lib/site";

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

function Services() {
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
          <WhatsAppButton variant="ink" message="هلا ماين ستريم، أبغى أعرف أكثر عن خدماتكم.">
            اسألنا عن خدمة
          </WhatsAppButton>
        </div>
        <ServiceCards />
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
    </section>
  );
}

function Watchlist() {
  return (
    <section className="section watchlist" aria-labelledby="watch-title">
      <div className="wrap">
        <div className="watchlist__head">
          <h2 id="watch-title" className="display display--md">
            قائمة المراقبة
          </h2>
          <p className="lede">ملفات عملائنا قيد التجهيز للنشر. قريباً تشوف الشغل بنفسك.</p>
        </div>
        <ul className="watchlist__row">
          {[0, 1, 2].map((i) => (
            <li key={i} className="slot">
              <span className="slot__tab" dir="ltr">
                CLIENT FILE
              </span>
              <span className="slot__bar slot__bar--long" />
              <span className="slot__bar" />
              <span className="slot__bar slot__bar--short" />
              <span className="slot__stamp">يُضاف قريباً</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { t: "تكلّمنا واتساب", d: "رسالة وحدة تكفي. نحدد موعد اجتماع يناسبك." },
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

function Quote() {
  return (
    <section id="quote" className="section quote" aria-labelledby="quote-title">
      <div className="wrap quote__grid">
        <div className="quote__intro">
          <h2 id="quote-title" className="display display--md">
            اطلب عرض سعر
          </h2>
          <p className="lede">
            عبّ النموذج واختر الخدمات اللي تحتاجها. بتنفتح لك رسالة واتساب جاهزة فيها كل التفاصيل، وترسلها لنا بضغطة.
          </p>
          <p className="tag tag--ink">نرد عليك ونحدد موعد اجتماع</p>
        </div>
        <div className="quote__sheet">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <h2 id="faq-title" className="display display--md">
          الأسئلة الشائعة
        </h2>
        <div className="faq__list">
          {faqs.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
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
        <WhatsAppButton variant="paper" size="lg">
          احجز اجتماعك الآن
        </WhatsAppButton>
        <p className="tag tag--paper finale__tag" dir="ltr">
          WATCH US.
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        تخطَّ إلى المحتوى
      </a>
      <Nav />
      <main id="main">
        <span id="top" />
        <Hero />
        <Stream />
        <Services />
        <Why />
        <OneSalary />
        <Sectors />
        <Watchlist />
        <Process />
        <Quote />
        <Faq />
        <Finale />
      </main>
      <Footer />
      <EyeTracker />
    </>
  );
}
