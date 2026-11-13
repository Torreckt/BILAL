import type { ContactIntent } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  /** Which request the contact form opens on. */
  intent?: ContactIntent;
  variant?: "red" | "ink" | "paper";
  size?: "md" | "lg";
  className?: string;
};

const icons: Record<ContactIntent, React.ReactNode> = {
  meeting: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </g>
  ),
  quote: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9.5 13h6M9.5 17h4" />
    </g>
  ),
  inquiry: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M4 5h16v11H9l-5 4V5Z" />
      <path d="M9 10h6" />
    </g>
  ),
  partner: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="m3 11 4-4 5 2 5-2 4 4-5 5-4-3-4 3Z" />
    </g>
  ),
};

// Ribbon button that takes the visitor to the contact section with a request type already chosen.
export function ContactButton({ children, intent = "meeting", variant = "red", size = "md", className = "" }: Props) {
  return (
    <a className={`ribbon-btn ribbon-btn--${variant} ribbon-btn--${size} ${className}`} href={`#contact-${intent}`}>
      <svg className="ribbon-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {icons[intent]}
      </svg>
      <span>{children}</span>
    </a>
  );
}
