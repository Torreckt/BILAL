"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  { tag: "BRIEF", title: "ترسل طلبك", text: "من النموذج أو واتساب. نتواصل معك ونحدد موعد اجتماع يناسبك." },
  { tag: "PLAN", title: "نفهم نشاطك", text: "نجلس معك، نشوف جمهورك ومنافسينك، ونبني خطة الشهر." },
  { tag: "ON AIR", title: "نشغّل الضجة", text: "الفريق يبدأ: محتوى، تصوير، إعلانات. وآخر الشهر تقرير أداء واضح." },
];

// Three steps on one line. The line draws and the steps appear in turn the first time the section is seen.
export function Process() {
  const ref = useRef<HTMLOListElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
        <ol ref={ref} className={`steps ${seen ? "is-seen" : ""}`}>
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num" dir="ltr" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="step__card">
                <span className="step__tag" dir="ltr" aria-hidden="true">
                  {s.tag}
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
