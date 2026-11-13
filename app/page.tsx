import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ServiceCards } from "@/components/ServiceCards";
import { EyeTracker } from "@/components/EyeTracker";
import { Eye, Wave } from "@/components/Eye";
import { ContactButton } from "@/components/ContactButton";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";
import {
  DEFAULT_MESSAGE,
  INSTAGRAM_HANDLE,
  TIKTOK_HANDLE,
  WHATSAPP_NUMBER,
  faqs,
  reasons,
  roles,
  sectors,
  whatsappLink,
} from "@/lib/site";

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
          <ContactButton variant="ink" intent="inquiry">
            اسألنا عن خدمة
          </ContactButton>
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

// 966500000000 → +966 50 000 0000
const phoneDisplay = `+${WHATSAPP_NUMBER.slice(0, 3)} ${WHATSAPP_NUMBER.slice(3, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`;

const channels = [
  {
    label: "واتساب",
    value: "محادثة مباشرة مع الفريق",
    href: whatsappLink(DEFAULT_MESSAGE),
    icon: (
      <path
        fill="currentColor"
        d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
      />
    ),
  },
  {
    label: "اتصل علينا",
    value: phoneDisplay,
    href: `tel:+${WHATSAPP_NUMBER}`,
    ltr: true,
    icon: (
      <path
        fill="currentColor"
        d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z"
      />
    ),
  },
  {
    label: "إنستغرام",
    value: `@${INSTAGRAM_HANDLE}`,
    href: `https://instagram.com/${INSTAGRAM_HANDLE}`,
    ltr: true,
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    label: "تيك توك",
    value: `@${TIKTOK_HANDLE}`,
    href: `https://www.tiktok.com/@${TIKTOK_HANDLE}`,
    ltr: true,
    icon: (
      <path
        fill="currentColor"
        d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.4 6.4 0 1 0 5.4 6.3V8.6a8.2 8.2 0 0 0 4.8 1.5V6.7a4.8 4.8 0 0 1-4.8-4.7Z"
      />
    ),
  },
];

function Contact() {
  return (
    <section id="contact" className="section quote" aria-labelledby="contact-title">
      {/* Scroll targets for ContactButton links; ContactForm reads which one was used. */}
      <span id="contact-meeting" className="contact__anchor" />
      <span id="contact-quote" className="contact__anchor" />
      <span id="contact-inquiry" className="contact__anchor" />
      <span id="contact-partner" className="contact__anchor" />
      <div className="wrap quote__grid">
        <div className="quote__intro">
          <h2 id="contact-title" className="display display--md">
            تواصل معنا
          </h2>
          <p className="lede">
            تبي تحجز اجتماع، أو تطلب عرض سعر، أو عندك سؤال؟ اختر طلبك وعبّ النموذج، وبتنفتح لك رسالة واتساب جاهزة
            ترسلها لنا بضغطة.
          </p>
          <ul className="contact__channels" aria-label="قنوات التواصل المباشر">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {c.icon}
                  </svg>
                  <span className="contact__label">{c.label}</span>
                  <span className="contact__value" dir={c.ltr ? "ltr" : undefined}>
                    {c.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="quote__sheet">
          <ContactForm />
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
        <ContactButton variant="paper" size="lg">
          احجز اجتماعك الآن
        </ContactButton>
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
        <Contact />
        <Faq />
        <Finale />
      </main>
      <Footer />
      <EyeTracker />
    </>
  );
}
