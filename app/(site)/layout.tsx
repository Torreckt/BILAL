import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { JsonLd } from "@/components/JsonLd";
import { getLinks, getServices } from "@/lib/content";
import { env } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [links, services] = await Promise.all([getLinks(), getServices()]);
  return (
    <>
      <a className="skip" href="#main">
        تخطَّ إلى المحتوى
      </a>
      <Nav />
      <main id="main">{children}</main>
      <Footer links={links} services={services.map(({ slug, title }) => ({ slug, title }))} />
      <JsonLd
        data={{
          "@type": "ProfessionalService",
          "@id": `${env.siteUrl}/#org`,
          name: "ماين ستريم Mainstream",
          alternateName: "Mainstream Marketing Agency",
          url: env.siteUrl,
          logo: `${env.siteUrl}/brand/logo-primary.png`,
          image: `${env.siteUrl}/og.jpg`,
          description: "وكالة تسويق متكاملة في السعودية.",
          email: links.email,
          telephone: `+${links.whatsapp}`,
          address: { "@type": "PostalAddress", addressCountry: "SA" },
          areaServed: "SA",
          sameAs: [`https://instagram.com/${links.instagram}`, `https://www.tiktok.com/@${links.tiktok}`],
        }}
      />
    </>
  );
}
