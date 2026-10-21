import { useId } from "react";

type EyeProps = {
  className?: string;
  wave?: boolean;
  /** Outline colour: ink on light grounds, off-white on black (Dark version). */
  tone?: "ink" | "light";
};

// The brand mark: the eye (attention) over the wave (the stream). Colours are fixed by the guidelines.
export function Eye({ className, wave = true, tone = "ink" }: EyeProps) {
  const id = useId();
  const outline = tone === "ink" ? "#111111" : "#F2EDE4";
  const almond = "M6 40C30 9 90 9 114 40C90 71 30 71 6 40Z";
  return (
    <svg
      className={className}
      viewBox={wave ? "0 0 120 92" : "0 0 120 80"}
      aria-hidden="true"
      focusable="false"
      data-eye
    >
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={almond} />
        </clipPath>
      </defs>
      <path d={almond} fill="#FFFFFF" />
      <g clipPath={`url(#${id}-c)`}>
        <g data-pupil>
          <circle cx="60" cy="40" r="18" fill="#A3121F" />
          <circle cx="60" cy="40" r="7.5" fill="#111111" />
          <circle cx="65" cy="34.5" r="3.2" fill="#FFFFFF" />
        </g>
      </g>
      <path d={almond} fill="none" stroke={outline} strokeWidth="6" strokeLinejoin="round" />
      {wave && (
        <path
          d="M33 84c4.5-5 9-5 13.5 0s9 5 13.5 0 9-5 13.5 0 9 5 13.5 0"
          fill="none"
          stroke="#A3121F"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function Wave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 16" aria-hidden="true" focusable="false">
      <path
        d="M4 8c6.5-7 13-7 19.5 0s13 7 19.5 0 13-7 19.5 0 13 7 19.5 0 13-7 19.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
