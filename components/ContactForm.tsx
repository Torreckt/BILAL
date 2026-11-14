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

// One form for every way in: a meeting, a quote, a question or a partnership.
// The request is saved on the server first; WhatsApp is an optional follow-up carrying the reference number.
export function ContactForm({ services, whatsapp, initialIntent = "meeting", initialService }: Props) {
  const [intent, setIntent] = useState<ContactIntent>(initialIntent);
  const [picked, setPicked] = useState<string[]>(initialService ? [initialService] : []);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "failed">("idle");
  const [day, setDay] = useState("");
  const [withEmail, setWithEmail] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  // One key per filled form: a double click or a retry after a dropped connection reuses it, so only one request is stored.
  const idem = useRef("");
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // Buttons elsewhere link to #contact-<intent>: pick that request type (on click, and on arrival from another page).
  useEffect(() => {
    const pick = (hash: string) => {
      const m = hash.match(/#contact-(\w+)$/);
      if (!m || !isIntent(m[1])) return;
      setIntent(m[1]);
      setErrors({});
      setSent(null);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="#contact-"]');
      if (a) pick(a.getAttribute("href")!);
    };
    pick(location.hash);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

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
      day,
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
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ref) {
        idem.current = "";
        setState("idle");
        setSent({ ref: data.ref, type: intent, services: picked, day: payload.day, name: payload.name });
        track("request_saved", { request_type: intent, service: picked.join(","), source: payload.source });
        return;
      }
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        // Fields tucked away must be on screen to show their error.
        if (data.errors.email) setWithEmail(true);
        setState("idle");
        // Move focus to the first field that needs fixing.
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      setErrors({ form: data.error ?? "صار خطأ من عندنا. جرّب مرة ثانية." });
    } catch {
      setErrors({ form: "انقطع الاتصال قبل ما يوصل طلبك. تأكد من النت واضغط إرسال مرة ثانية، وما راح يتكرر الطلب." });
    }
    setState("failed");
  }

  if (sent) {
    const titles = sent.services.map((s) => services.find((x) => x.slug === s)?.title ?? s);
    const msg = [
      `${contactIntents.find((c) => c.id === sent.type)!.emoji} *${intentLabel(sent.type)}*`,
      `الرقم المرجعي: *${sent.ref}*`,
      "",
      `هلا ماين ستريم 👋 أنا ${sent.name}، أرسلت طلب من الموقع وأبغى أتابعه.`,
      ...(titles.length ? ["", "*الخدمات المطلوبة*", ...titles.map((t, i) => `${i + 1}. ${t}`)] : []),
      ...(sent.day ? ["", `اليوم المفضل: ${formatDay(sent.day)}`] : []),
    ].join("\n");
    const onWhatsApp = () => {
      const data = { type: sent.type, service: sent.services.join(","), source: pageSource() };
      track("whatsapp_click", { request_type: data.type, service: data.service, source: data.source });
      navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({ name: "whatsapp_click", ...data })], { type: "application/json" }));
    };
    return (
      <div className="sent" ref={doneRef} tabIndex={-1} role="status">
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
          <button type="button" className="text-link sent__again" onClick={() => setSent(null)}>
            أرسل طلب ثاني
          </button>
        </div>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? (
      <span id={`err-${name}`} className="form__error" role="alert">
        {errors[name]}
      </span>
    ) : null;
  const aria = (name: string) => ({ "aria-invalid": !!errors[name] || undefined, "aria-describedby": errors[name] ? `err-${name}` : undefined });
  const label = (text: string, optional = false) => (
    <span className="form__label">
      {text} {optional && <em>(اختياري)</em>}
    </span>
  );
  // One-tap choices instead of dropdowns: a row of radio chips.
  const choices = (name: string, options: string[], required = false) => (
    <div className="chips">
      {options.map((o) => (
        <label key={o} className="chip">
          <input type="radio" name={name} value={o} required={required} />
          {o}
        </label>
      ))}
    </div>
  );
  const messageLabel = { meeting: "ملاحظات", quote: "وصف الاحتياج", inquiry: "سؤالك", partner: "مقترح التعاون" }[intent];
  const messagePlaceholder = {
    meeting: "مثلاً: عندنا افتتاح فرع جديد الشهر الجاي",
    quote: "وش تحتاج بالضبط؟ مثلاً: إدارة حسابين وتصوير شهري",
    inquiry: "اكتب سؤالك",
    partner: "عرّفنا على فكرتك وكيف نتعاون",
  }[intent];
  const message = (
    <label className="field">
      {label(messageLabel, intent === "meeting")}
      <textarea name="message" rows={3} maxLength={2000} required={intent !== "meeting"} placeholder={messagePlaceholder} {...aria("message")} />
      {err("message")}
    </label>
  );
  const business = (text: string, required: boolean) => (
    <label className="field">
      {label(text, !required)}
      <input name="business" required={required} maxLength={100} autoComplete="organization" {...aria("business")} />
      {err("business")}
    </label>
  );

  return (
    <form className="form" ref={formRef} onSubmit={onSubmit} noValidate aria-busy={state === "sending"}>
      <fieldset className="tabs">
        <legend className="form__label">وش تحتاج؟</legend>
        <div className="tabs__row">
          {contactIntents.map((c) => (
            <label key={c.id} className="tabs__tab">
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
      <div className="form__trap" aria-hidden="true">
        <label>
          لا تعبّي هذا الحقل
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="field">
        {label("الاسم")}
        <input name="name" required maxLength={80} autoComplete="name" {...aria("name")} />
        {err("name")}
      </label>

      <label className="field">
        {label("رقم الجوال")}
        <input name="phone" type="tel" inputMode="tel" maxLength={24} autoComplete="tel" dir="ltr" placeholder="05XXXXXXXX" {...aria("phone")} />
        {err("phone")}
      </label>
      {withEmail ? (
        <label className="field">
          {label("الإيميل")}
          <input name="email" type="email" inputMode="email" maxLength={120} autoComplete="email" dir="ltr" placeholder="name@example.com" autoFocus {...aria("email")} />
          {err("email")}
        </label>
      ) : (
        <button type="button" className="form__more" onClick={() => setWithEmail(true)}>
          تفضّل الإيميل؟ أضفه هنا
        </button>
      )}

      {intent === "meeting" && (
        <>
          <fieldset className="field" {...aria("meetingType")}>
            <legend className="form__label">نوع الاجتماع</legend>
            {choices("meetingType", meetingTypes, true)}
            {err("meetingType")}
          </fieldset>
          <div className="field">
            <label className="form__label" htmlFor="contact-day">
              اليوم المفضل <em>(اختياري)</em>
            </label>
            <div className="chips">
              {[
                ["اليوم", riyadhToday()],
                ["بكرة", riyadhToday(1)],
              ].map(([text, value]) => (
                <button key={text} type="button" className={`chip ${day === value ? "is-on" : ""}`} aria-pressed={day === value} onClick={() => setDay(day === value ? "" : value)}>
                  {text}
                </button>
              ))}
              <input
                id="contact-day"
                className="chip chip--date"
                name="day"
                type="date"
                value={day}
                min={riyadhToday()}
                max={riyadhToday(120)}
                onChange={(e) => setDay(e.target.value)}
                {...aria("day")}
              />
            </div>
            {err("day")}
          </div>
          <fieldset className="field">
            <legend className="form__label">
              الفترة المفضلة <em>(اختياري)</em>
            </legend>
            {choices("time", meetingTimes)}
          </fieldset>
          <p className="form__hint">هذا طلب اجتماع، والموعد يتأكد بعد ما يتواصل معك الفريق. الأوقات بتوقيت الرياض.</p>
        </>
      )}

      {intent === "quote" && (
        <>
          <fieldset className="field" aria-describedby={errors.services ? "err-services" : undefined}>
            <legend className="form__label">وش الخدمات اللي تحتاجها؟</legend>
            <div className="chips">
              {services.map((s) => (
                <label key={s.slug} className="chip">
                  <input type="checkbox" checked={picked.includes(s.slug)} onChange={() => toggle(s.slug)} />
                  {s.title}
                </label>
              ))}
            </div>
            {err("services")}
          </fieldset>
          {business("اسم النشاط", true)}
        </>
      )}
      {intent === "partner" && business("اسم الجهة", true)}

      {intent !== "meeting" && message}

      {/* Optional extras stay folded so the form reads short. */}
      {(intent === "meeting" || intent === "quote") && (
        <details className="form__extra">
          <summary>أضف تفاصيل (اختياري)</summary>
          <div className="form__extra-body">
            {intent === "meeting" && business("اسم النشاط", false)}
            {intent === "meeting" && message}
            {intent === "quote" && (
              <label className="field">
                {label("نوع النشاط", true)}
                <select name="sector" defaultValue="">
                  <option value="">اختر نوع نشاطك</option>
                  {sectors.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                  <option>غير ذلك</option>
                </select>
              </label>
            )}
          </div>
        </details>
      )}

      {errors.form && (
        <p className="form__error form__error--box" role="alert">
          {errors.form}
        </p>
      )}

      <div className="form__send">
        <button type="submit" className="ribbon-btn ribbon-btn--red ribbon-btn--lg form__submit" disabled={state === "sending"}>
          <span>{state === "sending" ? "جاري الإرسال…" : state === "failed" ? "أعد الإرسال" : "أرسل الطلب"}</span>
        </button>
        <p className="form__privacy">
          بإرسالك الطلب توافق على <a href="/privacy">سياسة الخصوصية</a>.
        </p>
      </div>
    </form>
  );
}
