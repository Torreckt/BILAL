"use client";

import { useState } from "react";
import { caseFiles, sectors, whatsappLink } from "@/lib/site";

// Collects a short brief and hands it to WhatsApp as one tidy message.
export function QuoteForm() {
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState(false);

  function toggle(title: string) {
    setError(false);
    setPicked((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!picked.length) {
      setError(true);
      return;
    }
    const f = new FormData(e.currentTarget);
    const line = (label: string, value: FormDataEntryValue | null) =>
      value && String(value).trim() ? `${label}: ${String(value).trim()}` : null;
    const msg = [
      "هلا ماين ستريم، أبغى عرض سعر.",
      "",
      line("الاسم", f.get("name")),
      line("اسم النشاط", f.get("business")),
      line("نوع النشاط", f.get("sector")),
      `الخدمات: ${picked.join("، ")}`,
      line("تفاصيل", f.get("notes")),
    ]
      .filter((l) => l !== null)
      .join("\n");
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="quote__form" onSubmit={onSubmit}>
      <div className="quote__row">
        <label className="quote__field">
          <span>الاسم</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label className="quote__field">
          <span>اسم النشاط</span>
          <input name="business" autoComplete="organization" />
        </label>
      </div>

      <label className="quote__field">
        <span>نوع النشاط</span>
        <select name="sector" defaultValue="">
          <option value="" disabled>
            اختر نوع نشاطك
          </option>
          {sectors.map((s) => (
            <option key={s}>{s}</option>
          ))}
          <option>غير ذلك</option>
        </select>
      </label>

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

      <label className="quote__field">
        <span>
          تفاصيل إضافية <em>(اختياري)</em>
        </span>
        <textarea name="notes" rows={3} placeholder="مثلاً: عندنا افتتاح فرع جديد الشهر الجاي" />
      </label>

      <button type="submit" className="ribbon-btn ribbon-btn--red ribbon-btn--lg quote__submit">
        <svg className="ribbon-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
          />
        </svg>
        <span>أرسل الطلب على واتساب</span>
      </button>
    </form>
  );
}
