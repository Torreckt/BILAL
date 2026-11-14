"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, social } from "./icons";
import { formatDay, riyadhToday } from "@/lib/dates";
import { contactIntents, intentLabel, meetingTimes, meetingTypes, type ContactIntent } from "@/lib/intents";
import { sectors, whatsappLink } from "@/lib/site";

type Props = {
  services: { slug: string; title: string }[];
  whatsapp: string;
  initialIntent?: ContactIntent;
  /** Service preselected for a quote, e.g. on that service's page. */
  initialService?: string;
};
type Errors = Record<string, string>;
type Sent = { ref: string; type: ContactIntent; services: string[]; day: string; name: string };

const isIntent = (v: string): v is ContactIntent => contactIntents.some((c) => c.id === v);
const track = (name: string, data: Record<string, unknown>) => {
  // Anonymous funnel events only: never the visitor's name, phone or message.
  (window as { dataLayer?: unknown[] }).dataLayer?.push({ event: name, ...data });
};
const pageSource = () => {
  const utm = new URLSearchParams(location.search).get("utm_source");
  return location.pathname + (utm ? `?utm_source=${utm.slice(0, 60)}` : "");
};

type RequestPayload = Record<string, unknown> & { day: string; name: string; source: string };
type SubmitResult = { kind: "saved"; ref: string } | { kind: "invalid"; errors: Errors } | { kind: "failed"; error: string };

/** Sends the request to the server and sorts the answer into saved / needs fixing / failed. */
async function postRequest(payload: RequestPayload): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ref) return { kind: "saved", ref: data.ref };
    if (res.status === 422 && data.errors) return { kind: "invalid", errors: data.errors };
    return { kind: "failed", error: data.error ?? "صار خطأ من عندنا. جرّب مرة ثانية." };
  } catch {
    return { kind: "failed", error: "انقطع الاتصال قبل ما يوصل طلبك. تأكد من النت واضغط إرسال مرة ثانية، وما راح يتكرر الطلب." };
  }
}

/** Buttons elsewhere link to #contact-<intent>: report that request type (on click, and on arrival from another page). */
function useLinkedIntent(onPick: (intent: ContactIntent) => void) {
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  });
  useEffect(() => {
    const pick = (hash: string) => {
      const m = hash.match(/#contact-(\w+)$/);
      if (m && isIntent(m[1])) pickRef.current(m[1]);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="#contact-"]');
      if (a) pick(a.getAttribute("href")!);
    };
    pick(location.hash);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

/** The WhatsApp text a visitor can send after saving: the reference number plus what they asked for. */
function followUpMessage(sent: Sent, serviceTitle: (slug: string) => string) {
  const titles = sent.services.map(serviceTitle);
  return [
    `${contactIntents.find((c) => c.id === sent.type)!.emoji} *${intentLabel(sent.type)}*`,
    `الرقم المرجعي: *${sent.ref}*`,
    "",
    `هلا ماين ستريم 👋 أنا ${sent.name}، أرسلت طلب من الموقع وأبغى أتابعه.`,
    ...(titles.length ? ["", "*الخدمات المطلوبة*", ...titles.map((t, i) => `${i + 1}. ${t}`)] : []),
    ...(sent.day ? ["", `اليوم المفضل: ${formatDay(sent.day)}`] : []),
  ].join("\n");
}

/** Confirmation shown in place of the form once the request is saved. Takes focus so screen readers announce it. */
function SentCard({ sent, services, whatsapp, onAgain }: { sent: Sent; services: Props["services"]; whatsapp: string; onAgain: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const msg = followUpMessage(sent, (slug) => services.find((x) => x.slug === slug)?.title ?? slug);
  const onWhatsApp = () => {
    const data = { type: sent.type, service: sent.services.join(","), source: pageSource() };
    track("whatsapp_click", { request_type: data.type, service: data.service, source: data.source });
    navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({ name: "whatsapp_click", ...data })], { type: "application/json" }));
  };
  return (
    <div className="sent" ref={ref} tabIndex={-1} role="status">
      <p className="sent__stamp">وصلنا طلبك</p>
      <p className="sent__ref">
        رقمك المرجعي
        <strong dir="ltr">{sent.ref}</strong>
      </p>
      <p className="sent__text">
        {sent.type === "meeting"
          ? "بيتواصل معك الفريق لتأكيد موعد الاجتماع. الموعد ما يعتبر مؤكد إلا بعد تواصلنا معك."
          : "حفظنا طلبك وبيتواصل معك الفريق قريب. احتفظ بالرقم المرجعي للمتابعة."}
      </p>
      <div className="sent__actions">
        <a
          className="ribbon-btn ribbon-btn--red ribbon-btn--md"
          href={whatsappLink(whatsapp, msg)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
        >
          <Icon className="ribbon-btn__icon">{social.whatsapp}</Icon>
          <span>تابع طلبك على واتساب</span>
        </a>
        <button type="button" className="text-link sent__again" onClick={onAgain}>
          أرسل طلب ثاني
        </button>
      </div>
    </div>
  );
}

// The message box changes its label and example with the request type.
const MESSAGE_FIELD: Record<ContactIntent, { label: string; placeholder: string }> = {
  meeting: { label: "تفاصيل إضافية", placeholder: "مثلاً: عندنا افتتاح فرع جديد الشهر الجاي" },
  quote: { label: "وصف الاحتياج", placeholder: "وش تحتاج بالضبط؟ مثلاً: إدارة حسابين وتصوير شهري" },
  inquiry: { label: "سؤالك", placeholder: "اكتب سؤالك" },
  partner: { label: "مقترح التعاون", placeholder: "عرّفنا على فكرتك وكيف نتعاون" },
};

// One form for every way in: a meeting, a quote, a question or a partnership.
// The request is saved on the server first; WhatsApp is an optional follow-up carrying the reference number.
export function ContactForm({ services, whatsapp, initialIntent = "meeting", initialService }: Props) {
  const [intent, setIntent] = useState<ContactIntent>(initialIntent);
  const [picked, setPicked] = useState<string[]>(initialService ? [initialService] : []);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "failed">("idle");
  const [sent, setSent] = useState<Sent | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // One key per filled form: a double click or a retry after a dropped connection reuses it, so only one request is stored.
  const idem = useRef("");
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  useLinkedIntent((linked) => {
    setIntent(linked);
    setErrors({});
    setSent(null);
  });

  function toggle(slug: string) {
    setErrors((e) => ({ ...e, services: "" }));
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const f = new FormData(e.currentTarget);
    const get = (key: string) => String(f.get(key) ?? "").trim();
    idem.current ||= crypto.randomUUID();
    const payload = {
      type: intent,
      idem: idem.current,
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      business: get("business"),
      sector: get("sector"),
      meetingType: get("meetingType"),
      day: get("day"),
      time: get("time"),
      subject: get("subject"),
      message: get("message"),
      services: picked,
      website: get("website"),
      elapsed: Date.now() - openedAt.current,
      source: pageSource(),
    };
    setState("sending");
    setErrors({});
    const result = await postRequest(payload);
    if (result.kind === "saved") {
      idem.current = "";
      setState("idle");
      setSent({ ref: result.ref, type: intent, services: picked, day: payload.day, name: payload.name });
      track("request_saved", { request_type: intent, service: picked.join(","), source: payload.source });
    } else if (result.kind === "invalid") {
      setErrors(result.errors);
      setState("idle");
      // Move focus to the first field that needs fixing.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    } else {
      setErrors({ form: result.error });
      setState("failed");
    }
  }

  if (sent) return <SentCard sent={sent} services={services} whatsapp={whatsapp} onAgain={() => setSent(null)} />;

  const err = (name: string) =>
    errors[name] ? (
      <span id={`err-${name}`} className="quote__error" role="alert">
        {errors[name]}
      </span>
    ) : null;
  const aria = (name: string) => ({ "aria-invalid": !!errors[name] || undefined, "aria-describedby": errors[name] ? `err-${name}` : undefined });
  const label = (text: string, optional = false) => (
    <span>
      {text} {optional && <em>(اختياري)</em>}
    </span>
  );
  const businessLabel = intent === "partner" ? "اسم الجهة" : "اسم النشاط";
  const businessRequired = intent === "quote" || intent === "partner";
  const message = MESSAGE_FIELD[intent];

  return (
    <form className="quote__form" ref={formRef} onSubmit={onSubmit} noValidate aria-busy={state === "sending"}>
      <fieldset className="contact__intents">
        <legend>وش تحتاج؟</legend>
        <div className="contact__tabs">
          {contactIntents.map((c) => (
            <label key={c.id} className={`contact__tab ${intent === c.id ? "is-on" : ""}`}>
              <input
                type="radio"
                name="intent"
                value={c.id}
                checked={intent === c.id}
                onChange={() => {
                  setIntent(c.id);
                  setErrors({});
                }}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Hidden from people; bots that fill every field give themselves away. */}
      <div className="quote__trap" aria-hidden="true">
        <label>
          لا تعبّي هذا الحقل
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="quote__field">
        {label("الاسم")}
        <input name="name" required maxLength={80} autoComplete="name" {...aria("name")} />
        {err("name")}
      </label>

      <div className="quote__row">
        <label className="quote__field">
          {label("رقم الجوال")}
          <input name="phone" type="tel" inputMode="tel" maxLength={24} autoComplete="tel" dir="ltr" placeholder="05XXXXXXXX" {...aria("phone")} />
          {err("phone")}
        </label>
        <label className="quote__field">
          {label("الإيميل")}
          <input name="email" type="email" inputMode="email" maxLength={120} autoComplete="email" dir="ltr" placeholder="name@example.com" {...aria("email")} />
          {err("email")}
        </label>
      </div>
      <p className="quote__hint">يكفي واحد منهم: الجوال أو الإيميل.</p>

      {intent === "inquiry" ? (
        <label className="quote__field">
          {label("موضوع الاستفسار")}
          <input name="subject" required maxLength={120} {...aria("subject")} />
          {err("subject")}
        </label>
      ) : (
        <div className="quote__row">
          <label className="quote__field">
            {label(businessLabel, !businessRequired)}
            <input name="business" required={businessRequired} maxLength={100} autoComplete="organization" {...aria("business")} />
            {err("business")}
          </label>
          <label className="quote__field">
            {label("نوع النشاط", true)}
            <select name="sector" defaultValue="">
              <option value="">اختر نوع نشاطك</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
              ))}
              <option>غير ذلك</option>
            </select>
          </label>
        </div>
      )}

      {intent === "meeting" && (
        <>
          <div className="contact__meeting">
            <label className="quote__field">
              {label("نوع الاجتماع")}
              <select name="meetingType" required defaultValue="" {...aria("meetingType")}>
                <option value="" disabled>
                  اختر
                </option>
                {meetingTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {err("meetingType")}
            </label>
            <label className="quote__field">
              {label("اليوم المفضل", true)}
              <input name="day" type="date" min={riyadhToday()} max={riyadhToday(120)} {...aria("day")} />
              {err("day")}
            </label>
            <label className="quote__field">
              {label("الفترة المفضلة", true)}
              <select name="time" defaultValue="">
                <option value="">أي وقت</option>
                {meetingTimes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="quote__hint">هذا طلب اجتماع، والموعد يتأكد بعد ما يتواصل معك الفريق. الأوقات بتوقيت الرياض.</p>
        </>
      )}

      {intent === "quote" && (
        <fieldset className="quote__services" aria-describedby={errors.services ? "err-services" : undefined}>
          <legend>وش الخدمات اللي تحتاجها؟</legend>
          <div className="quote__chips">
            {services.map((s) => (
              <label key={s.slug} className={`quote__chip ${picked.includes(s.slug) ? "is-on" : ""}`}>
                <input type="checkbox" checked={picked.includes(s.slug)} onChange={() => toggle(s.slug)} />
                {s.title}
              </label>
            ))}
          </div>
          {err("services")}
        </fieldset>
      )}

      <label className="quote__field">
        {label(message.label, intent === "meeting")}
        <textarea name="message" rows={3} maxLength={2000} required={intent !== "meeting"} placeholder={message.placeholder} {...aria("message")} />
        {err("message")}
      </label>

      {errors.form && (
        <p className="quote__error quote__error--form" role="alert">
          {errors.form}
        </p>
      )}

      <div className="quote__send">
        <button type="submit" className="ribbon-btn ribbon-btn--red ribbon-btn--lg quote__submit" disabled={state === "sending"}>
          <span>{state === "sending" ? "جاري الإرسال…" : state === "failed" ? "أعد الإرسال" : "أرسل الطلب"}</span>
        </button>
        <p className="quote__privacy">
          بإرسالك الطلب توافق على <a href="/privacy">سياسة الخصوصية</a>.
        </p>
      </div>
    </form>
  );
}
