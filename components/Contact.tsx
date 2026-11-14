import { ContactForm } from "./ContactForm";
import { Icon, social } from "./icons";
import type { ContactIntent } from "@/lib/intents";
import { DEFAULT_MESSAGE, whatsappLink, type Links } from "@/lib/site";

type Props = {
  links: Links;
  services: { slug: string; title: string }[];
  title?: string;
  lede?: string;
  initialIntent?: ContactIntent;
  initialService?: string;
};

// The form comes first. Direct channels sit after it as a quieter alternative, not as competing buttons.
export function Contact({
  links,
  services,
  title = "تواصل معنا",
  lede = "انت استرخ.. وخلي الإبداع علينا. اختر طلبك وعبّه، ويطلع لك رقم مرجعي تتابع فيه.",
  initialIntent,
  initialService,
}: Props) {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      {/* Scroll targets for ContactButton links; ContactForm reads which one was used. */}
      <span id="contact-meeting" className="contact__anchor" />
      <span id="contact-quote" className="contact__anchor" />
      <span id="contact-inquiry" className="contact__anchor" />
      <span id="contact-partner" className="contact__anchor" />
      <div className="wrap contact__grid">
        <div className="contact__head">
          <h2 id="contact-title" className="display display--md">
            {title}
          </h2>
          <p className="lede">{lede}</p>
        </div>
        <div className="sheet contact__sheet">
          <ContactForm services={services} whatsapp={links.whatsapp} initialIntent={initialIntent} initialService={initialService} />
        </div>
        <div className="contact__direct">
          <p className="contact__or">أو كلّمنا مباشرة</p>
          <div className="contact__channels">
            <a className="btn btn--ink" href={whatsappLink(links.whatsapp, DEFAULT_MESSAGE)} target="_blank" rel="noopener noreferrer">
              <Icon>{social.whatsapp}</Icon>
              واتساب
            </a>
            <a className="btn btn--square" href={`tel:+${links.whatsapp}`} aria-label="اتصل علينا" title="اتصل علينا">
              <Icon>{social.phone}</Icon>
            </a>
            <a className="btn btn--square" href={`mailto:${links.email}`} aria-label="راسلنا على الإيميل" title="راسلنا على الإيميل">
              <Icon>{social.email}</Icon>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
