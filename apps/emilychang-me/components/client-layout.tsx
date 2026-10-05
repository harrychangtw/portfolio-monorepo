"use client";

import type React from "react";
import { Suspense } from "react";
import EmilyHeader from "./emily-header";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider } from "@portfolio/lib/contexts/language-context";
import { NavigationProvider } from "@portfolio/lib/contexts/navigation-context";
import VideoInitializer from "@portfolio/ui/video-initializer";
import NotificationProvider from "@portfolio/ui/notification-provider";
import { useStableAnchor } from "@portfolio/lib/hooks/use-stable-anchor";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useStableAnchor(["design", "creation", "art", "sketches"], "header");

  return (
    <NavigationProvider>
      <LanguageProvider englishOnly namespaces={["common", "about", "uses"]}>
        <EmilyHeader />
        {children}
        <VideoInitializer />
        <Suspense fallback={null}>
          <NotificationProvider />
        </Suspense>
        <Analytics />
      </LanguageProvider>
    </NavigationProvider>
  );
}
