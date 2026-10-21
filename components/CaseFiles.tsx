"use client";

import { useRef, useState } from "react";
import { caseFiles } from "@/lib/site";

export function CaseFiles() {
  const [current, setCurrent] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const file = caseFiles[current];

  function onKeyDown(e: React.KeyboardEvent) {
    // RTL: the next tab sits to the left.
    const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    let next = current;
    if (step) next = (current + step + caseFiles.length) % caseFiles.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = caseFiles.length - 1;
    else return;
    e.preventDefault();
    setCurrent(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="files">
      <div className="files__tabs" role="tablist" aria-label="ملفات الخدمات" onKeyDown={onKeyDown}>
        {caseFiles.map((f, i) => (
          <button
            key={f.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${f.id}`}
            aria-selected={i === current}
            aria-controls={`panel-${f.id}`}
            tabIndex={i === current ? 0 : -1}
            className="files__tab"
            onClick={() => setCurrent(i)}
          >
            <span className="files__tab-title">{f.title}</span>
          </button>
        ))}
      </div>

      <div
        key={file.id}
        className="files__sheet"
        role="tabpanel"
        id={`panel-${file.id}`}
        aria-labelledby={`tab-${file.id}`}
        tabIndex={0}
      >
        <p className="ghost ghost--file" aria-hidden="true">
          {file.code}
        </p>
        <div className="files__meta" aria-hidden="true">
          <span>FILE · {file.code}</span>
          <span>MAINSTREAM / RIYADH</span>
        </div>
        <h3 className="files__title">{file.title}</h3>
        <p className="files__line">{file.line}</p>
        <ul className="files__items">
          {file.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="files__stamp" aria-hidden="true">
          ضمن الفريق
        </p>
      </div>
    </div>
  );
}
