"use client";

import { useEffect, useState } from "react";
import {
  caseFiles,
  contactIntents,
  meetingTimes,
  meetingTypes,
  sectors,
  whatsappLink,
  type ContactIntent,
} from "@/lib/site";

const isIntent = (v: string): v is ContactIntent => contactIntents.some((c) => c.id === v);

// One form for every way in: booking a meeting, a quote, a question or a partnership.
// It hands the brief to WhatsApp as one tidy message.
export function ContactForm() {
  const [intent, setIntent] = useState<ContactIntent>("meeting");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState(false);

  // Buttons elsewhere link to #contact-<intent> (anchors at the top of the section): pick that request type.
  // Read from the click as well as the hash, so pressing the same button again still switches back.
  useEffect(() => {
    const pick = (hash: string) => {
      const m = hash.match(/^#contact-(\w+)$/);
      if (!m || !isIntent(m[1])) return;
      setIntent(m[1]);
      setError(false);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#contact-"]');
      if (a) pick(a.getAttribute("href")!);
    };
    pick(location.hash);
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function toggle(title: string) {
    setError(false);
    setPicked((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (intent === "quote" && !picked.length) {
      setError(true);
      return;
    }
    const f = new FormData(e.currentTarget);
    const line = (label: string, key: string) => {
      const v = String(f.get(key) ?? "").trim();
      return v ? `${label}: ${v}` : null;
    };
    const day = String(f.get("day") ?? "");
    const msg = [
      contactIntents.find((c) => c.id === intent)!.opener,
      "",
      line("الاسم", "name"),
      line("رقم التواصل", "phone"),
      line("اسم النشاط", "business"),
      line("نوع النشاط", "sector"),
      intent === "meeting" ? line("نوع الاجتماع", "meetingType") : null,
      intent === "meeting" && day ? `اليوم المناسب: ${new Date(`${day}T12:00`).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long" })}` : null,
      intent === "meeting" ? line("الوقت المناسب", "time") : null,
      intent === "quote" ? `الخدمات: ${picked.join("، ")}` : null,
      line(intent === "inquiry" || intent === "partner" ? "الرسالة" : "تفاصيل", "notes"),
    ]
      .filter((l) => l !== null)
      .join("\n");
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
  }

  const needsMessage = intent === "inquiry" || intent === "partner";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="quote__form" onSubmit={onSubmit}>
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
                  setError(false);
                }}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="quote__row">
        <label className="quote__field">
          <span>الاسم</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label className="quote__field">
          <span>
            رقم التواصل <em>(اختياري)</em>
          </span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="05XXXXXXXX" />
        </label>
      </div>

      <div className="quote__row">
        <label className="quote__field">
          <span>
            اسم النشاط <em>(اختياري)</em>
          </span>
          <input name="business" autoComplete="organization" />
        </label>
        <label className="quote__field">
          <span>
            نوع النشاط <em>(اختياري)</em>
          </span>
          <select name="sector" defaultValue="">
            <option value="">اختر نوع نشاطك</option>
            {sectors.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option>غير ذلك</option>
          </select>
        </label>
      </div>

      {intent === "meeting" && (
        <div className="contact__meeting">
          <label className="quote__field">
            <span>نوع الاجتماع</span>
            <select name="meetingType" required defaultValue="">
              <option value="" disabled>
                اختر
              </option>
              {meetingTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="quote__field">
            <span>
              اليوم المناسب <em>(اختياري)</em>
            </span>
            <input name="day" type="date" min={today} />
          </label>
          <label className="quote__field">
            <span>
              الوقت المناسب <em>(اختياري)</em>
            </span>
            <select name="time" defaultValue="">
              <option value="">أي وقت</option>
              {meetingTimes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {intent === "quote" && (
        <fieldset className="quote__services" aria-describedby={error ? "quote-error" : undefined}>
          <legend>وش الخدمات اللي تحتاجها؟</legend>
          <div className="quote__chips">
            {caseFiles.map((s) => (
              <label key={s.id} className={`quote__chip ${picked.includes(s.title) ? "is-on" : ""}`}>
                <input type="checkbox" checked={picked.includes(s.title)} onChange={() => toggle(s.title)} />
                {s.title}
              </label>
            ))}
          </div>
          {error && (
            <p id="quote-error" className="quote__error" role="alert">
              اختر خدمة وحدة على الأقل.
            </p>
          )}
        </fieldset>
      )}

      <label className="quote__field">
        <span>
          {needsMessage ? "رسالتك" : "تفاصيل إضافية"} {!needsMessage && <em>(اختياري)</em>}
        </span>
        <textarea
          name="notes"
          rows={3}
          required={needsMessage}
          placeholder={
            intent === "partner"
              ? "عرّفنا على فكرتك أو جهتك"
              : intent === "inquiry"
                ? "اكتب سؤالك"
                : "مثلاً: عندنا افتتاح فرع جديد الشهر الجاي"
          }
        />
      </label>

      <button type="submit" className="ribbon-btn ribbon-btn--red ribbon-btn--lg quote__submit">
        <svg className="ribbon-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
          />
        </svg>
        <span>أرسل على واتساب</span>
      </button>
    </form>
  );
}
