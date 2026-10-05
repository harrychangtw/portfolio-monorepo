"use client";

import type React from "react";
import {
  LanguageProvider,
  type Language,
} from "@portfolio/lib/contexts/language-context";
import { bundledTranslations } from "@/lib/bundled-translations";
import NavigationLink from "@portfolio/ui/navigation-link";
import { ThemeProvider } from "@portfolio/lib/contexts/theme-context";
import Header from "@/components/header";

export default function GraphClientLayout({
  children,
  initialLanguage,
}: Readonly<{
  children: React.ReactNode;
  initialLanguage: Language;
}>) {
  return (
    <ThemeProvider>
      <LanguageProvider
        internalLinkComponent={NavigationLink}
        bundledTranslations={bundledTranslations}
        initialLanguage={initialLanguage}
      >
        <Header />
        <main className="flex-1 pt-16">{children}</main>
      </LanguageProvider>
    </ThemeProvider>
  );
}
