import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ServiceCards } from "@/components/ServiceCards";
import { EyeTracker } from "@/components/EyeTracker";
import { Eye, Wave } from "@/components/Eye";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Footer } from "@/components/Footer";
import { cafePackage, roles } from "@/lib/site";

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
      <div className="stream__track">
        <div className="stream__run">{phrase}</div>
        <div className="stream__run">{phrase}</div>
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
            لو توظّف مسوّق واحد، تاخذ عين وحدة على نشاطك. مع ماين ستريم نفس الراتب يشغّل لك فريق كامل،
            كل واحد متخصص في شغلته.
          </p>
          <p className="tag tag--ink salary__tag">تصميم · محتوى · تصوير · إعلانات · نتائج</p>
        </div>

        <div className="salary__compare">
          <figure className="ledger ledger--one">
            <figcaption className="ledger__head">موظف واحد</figcaption>
            <div className="ledger__eyes ledger__eyes--one">
              <Eye className="ledger__eye" />
            </div>
            <p className="ledger__note">شخص واحد يحاول يسوي كل شي</p>
          </figure>
          <span className="salary__vs" aria-hidden="true">
            =
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
            <p className="ledger__note">بنفس الراتب</p>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Packages() {
  const msg = "هلا ماين ستريم، أبغى أحجز باقة الكوفيهات.";
  return (
    <section id="packages" className="section packages" aria-labelledby="packages-title">
      <p className="ghost ghost--cafe" aria-hidden="true">
        CAFÉ
      </p>
      <div className="wrap">
        <h2 id="packages-title" className="display display--md packages__title">
          الباقات
        </h2>

        <article className="dossier" aria-labelledby="cafe-title">
          <header className="dossier__head">
            <h3 id="cafe-title" className="dossier__title">
              باقة الكوفيهات
            </h3>
            <p className="dossier__ribbon">
              <span className="tag tag--red">تسويق + تدريب + متابعة..</span>
              <span className="tag tag--red">في باقة وحدة</span>
            </p>
            <p className="dossier__stamp" aria-hidden="true" dir="ltr">
              WATCH US.
            </p>
          </header>

          <div className="dossier__body">
            {cafePackage.blocks.map((b) => (
              <section key={b.title} className="dossier__block">
                <h4>{b.title}</h4>
                {"note" in b && b.note ? <p className="dossier__note">{b.note}</p> : null}
                <ul>
                  {b.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="dossier__foot">
            <div className="dossier__ads">
              <h4>الإعلانات المدفوعة</h4>
              <p>{cafePackage.ad}</p>
            </div>

            <aside className="gift" aria-label="هدية الوكالة">
              <p className="tag tag--red gift__tag">هدية الوكالة</p>
              <p className="gift__title">أسبوع مجاني إضافي</p>
              <p className="gift__text">
                لكل مشترك جديد في أول شهر: أسبوع كامل نقدّم فيه الخدمات والاستشارات ومتابعة إنتاجية المحل..
                مجاناً.
              </p>
            </aside>

            <div className="price">
              <div className="price__tag">
                <p className="price__label">سعر الباقة</p>
                <p className="price__value">
                  <span dir="ltr">{cafePackage.price}</span> ريال
                </p>
              </div>
              <WhatsAppButton variant="ink" message={msg}>
                احجز الباقة
              </WhatsAppButton>
            </div>
          </div>
        </article>

        <article className="teamplan" aria-labelledby="teamplan-title">
          <div className="teamplan__copy">
            <h3 id="teamplan-title" className="teamplan__title">
              فريقك التسويقي المتكامل
            </h3>
            <p className="tag tag--paper teamplan__ribbon">براتب موظف واحد.</p>
            <p className="teamplan__text">
              لأي نشاط، مو بس الكوفيهات. نبني الفريق على حجم شغلك، ونعطيك السعر في أول اجتماع.
            </p>
            <WhatsAppButton variant="red" message="هلا ماين ستريم، أبغى أعرف سعر باقة الفريق المتكامل.">
              اطلب السعر
            </WhatsAppButton>
          </div>
          <ul className="teamplan__roles">
            {roles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>
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
        <OneSalary />
        <Packages />
        <Watchlist />
        <Process />
        <Finale />
      </main>
      <Footer />
      <EyeTracker />
    </>
  );
}
