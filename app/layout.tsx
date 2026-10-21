import type { Metadata, Viewport } from "next";
import { Gloock, Rakkas, Space_Grotesk, Tajawal } from "next/font/google";
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

export const metadata: Metadata = {
  // TODO: set NEXT_PUBLIC_SITE_URL to the live domain when deploying.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ماين ستريم | Mainstream — وكالة تسويق في الرياض",
  description:
    "فريقك التسويقي المتكامل براتب موظف واحد: سوشال ميديا، تصوير وريلز، إعلانات مدفوعة، مؤثرين، وهوية. نصنع الضجة.. وأنت تملك الأضواء.",
  openGraph: {
    title: "Mainstream — We create the hype. You own the spotlight.",
    description: "وكالة تسويق في الرياض. فريقك التسويقي المتكامل براتب موظف واحد.",
    images: ["/brand/logo-primary.png"],
    locale: "ar_SA",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#B3A081",
};

// Runs before paint so entrance motion never hides content when JS or motion is unavailable.
const motionGate = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='ok'}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${gloock.variable} ${rakkas.variable} ${grotesk.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGate }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
