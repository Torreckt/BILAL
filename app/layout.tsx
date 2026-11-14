import type { Metadata, Viewport } from "next";
import { Gloock, Rakkas, Space_Grotesk, Tajawal } from "next/font/google";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import "./globals.css";

const gloock = Gloock({ weight: "400", subsets: ["latin"], variable: "--font-gloock", display: "swap" });
const rakkas = Rakkas({ weight: "400", subsets: ["arabic", "latin"], variable: "--font-rakkas", display: "swap" });
const grotesk = Space_Grotesk({ weight: "700", subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const tajawal = Tajawal({
  weight: ["400", "500", "700", "800"],
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  display: "swap",
});

const description =
  "وكالة تسويق متكاملة في الرياض: تسويق وإعلانات، سوشال ميديا، كتابة محتوى، تصوير، مونتاج، تصميم مواقع، هوية، وتدريب الكوفيهات. نصنع الضجة.. وأنت تملك الأضواء.";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "ماين ستريم | Mainstream — وكالة تسويق في الرياض", template: "%s | ماين ستريم Mainstream" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "ماين ستريم Mainstream",
    title: "ماين ستريم | Mainstream — وكالة تسويق في الرياض",
    description: "وكالة تسويق متكاملة في الرياض. نصنع الضجة.. وأنت تملك الأضواء.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "ماين ستريم — نصنع الضجة.. وأنت تملك الأضواء" }],
    locale: "ar_SA",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  // Staging stays out of search results.
  robots: env.noindex ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#B3A081",
};

// Runs before paint so entrance motion never hides content when JS or motion is unavailable.
const motionGate = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='ok'}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The proxy issues a fresh nonce per request; inline scripts must carry it to pass the Content-Security-Policy.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${gloock.variable} ${rakkas.variable} ${grotesk.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: motionGate }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
