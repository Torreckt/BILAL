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

// 966500000000 → +966 50 000 0000
const phoneDisplay = (n: string) => `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;

export function Contact({
  links,
  services,
  title = "تواصل معنا",
  lede = "تبي تطلب اجتماع، أو عرض سعر، أو عندك سؤال؟ اختر طلبك وعبّ النموذج. يوصلنا طلبك مباشرة، ويطلع لك رقم مرجعي تتابع فيه.",
  initialIntent,
  initialService,
}: Props) {
  const channels = [
    { label: "واتساب", value: "محادثة مباشرة مع الفريق", href: whatsappLink(links.whatsapp, DEFAULT_MESSAGE), icon: social.whatsapp },
    { label: "اتصل علينا", value: phoneDisplay(links.whatsapp), href: `tel:+${links.whatsapp}`, ltr: true, icon: social.phone },
    { label: "الإيميل", value: links.email, href: `mailto:${links.email}`, ltr: true, icon: social.email },
    { label: "إنستغرام", value: `@${links.instagram}`, href: `https://instagram.com/${links.instagram}`, ltr: true, icon: social.instagram },
    { label: "تيك توك", value: `@${links.tiktok}`, href: `https://www.tiktok.com/@${links.tiktok}`, ltr: true, icon: social.tiktok },
  ];
  return (
    <section id="contact" className="section quote" aria-labelledby="contact-title">
      {/* Scroll targets for ContactButton links; ContactForm reads which one was used. */}
      <span id="contact-meeting" className="contact__anchor" />
      <span id="contact-quote" className="contact__anchor" />
      <span id="contact-inquiry" className="contact__anchor" />
      <span id="contact-partner" className="contact__anchor" />
      <div className="wrap quote__grid">
        <div className="quote__intro">
          <h2 id="contact-title" className="display display--md">
            {title}
          </h2>
          <p className="lede">{lede}</p>
          <ul className="contact__channels" aria-label="قنوات التواصل المباشر">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                  <Icon>{c.icon}</Icon>
                  <span className="contact__label">{c.label}</span>
                  <span className="contact__value" dir={c.ltr ? "ltr" : undefined}>
                    {c.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="quote__sheet">
          <ContactForm services={services} whatsapp={links.whatsapp} initialIntent={initialIntent} initialService={initialService} />
        </div>
      </div>
    </section>
  );
}
