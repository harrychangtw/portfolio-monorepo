import "./globals.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const artific = localFont({
  src: [
    {
      path: "../public/fonts/artific-fonts/Artific-Regular.woff2",
      weight: "400",
    },
    {
      path: "../public/fonts/artific-fonts/Artific-Medium.woff2",
      weight: "500",
    },
    {
      path: "../public/fonts/artific-fonts/Artific-SemiBold.woff2",
      weight: "600",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Split", template: "%s · Split" },
  description: "Shared expenses, settled in as few transfers as possible.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plex.variable} ${artific.variable}`}
    >
      <head>
        {/* Same "theme" cookie as harrychang.me, so the choice carries over. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);if(m&&m[1]==='light')document.documentElement.classList.add('light')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
