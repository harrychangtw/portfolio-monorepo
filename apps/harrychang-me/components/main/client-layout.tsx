"use client";

import type React from "react";
import { Suspense } from "react";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import {
  LanguageProvider,
  type Language,
} from "@portfolio/lib/contexts/language-context";
import { bundledTranslations } from "@/lib/bundled-translations";
import NavigationLink from "@portfolio/ui/navigation-link";
import { ThemeProvider } from "@portfolio/lib/contexts/theme-context";
import VideoInitializer from "@portfolio/ui/video-initializer";
import NotificationProvider from "@portfolio/ui/notification-provider";
import { useStableAnchor } from "@portfolio/lib/hooks/use-stable-anchor";

export default function ClientLayout({
  children,
  initialLanguage,
}: Readonly<{
  children: React.ReactNode;
  initialLanguage: Language;
}>) {
  useStableAnchor(["projects", "gallery"], "header");

  return (
    <ThemeProvider>
      <LanguageProvider
        internalLinkComponent={NavigationLink}
        bundledTranslations={bundledTranslations}
        initialLanguage={initialLanguage}
      >
        <Header />
        {children}
        <VideoInitializer />
        <Suspense fallback={null}>
          <NotificationProvider />
        </Suspense>
        <Analytics />
      </LanguageProvider>
    </ThemeProvider>
  );
}
