import { DEFAULT_MESSAGE, whatsappLink } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  message?: string;
  variant?: "red" | "ink" | "paper";
  size?: "md" | "lg";
  className?: string;
};

export function WhatsAppButton({ children, message = DEFAULT_MESSAGE, variant = "red", size = "md", className = "" }: Props) {
  return (
    <a
      className={`ribbon-btn ribbon-btn--${variant} ribbon-btn--${size} ${className}`}
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg className="ribbon-btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z"
        />
      </svg>
      <span>{children}</span>
    </a>
  );
}
