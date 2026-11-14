"use client";

import { useLanguage } from "@portfolio/lib/contexts/language-context";
import dynamic from "next/dynamic";

const LanguageSwitcher = dynamic(
  () => import("@portfolio/ui/language-switcher"),
  { ssr: false },
);
const ThemeSwitcher = dynamic(() => import("@portfolio/ui/theme-switcher"), {
  ssr: false,
});

export default function AboutSection() {
  const { t, tHtml } = useLanguage();

  // Rows pair a role with its description. tHtml for every description so
  // links render consistently (debater has none, which tHtml handles too).
  const roles = [
    "llmResearcher",
    "speaker",
    "developer",
    "debater",
    "photographer",
  ];

  return (
    <section id="about" className="py-12 md:py-16 border-b border-border">
      <div className="container">
        {/* Six columns with the same gap as the three-up card grids below, so
            every column edge here (0, 1/2, 2/3) lands on a card edge or a card
            midline further down the page. */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-[var(--column-spacing)]">
          {/* About: columns 1-3 */}
          <div className="md:col-span-3 pr-0 md:pr-12 flex flex-col">
            <div>
              <h2 className="section-label mb-4">{t("about.title")}</h2>
              <p
                className="font-body text-primary lcp-bio"
                style={{ contain: "paint" }}
              >
                {tHtml("bio1", "about")}
                <br />
                <br />
                {tHtml("bio2", "about")}
                {t("bio3", "about") && (
                  <>
                    <br />
                    <br />
                    {tHtml("bio3", "about")}
                  </>
                )}
              </p>
            </div>
            {/* Visible on mobile (mt-8), kept at bottom on desktop (mt-auto) */}
            {/* min-h-[24px] prevents CLS while dynamic switchers are loading */}
            <div className="flex items-center mt-8 md:mt-auto pt-8 border-t border-border md:border-t-0 min-h-[64px] w-full">
              <div className="flex items-center gap-6">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </div>

          {/* Roles (column 4) + descriptions (columns 5-6). The nested grid
              reuses the outer gap, so its tracks match the outer ones exactly. */}
          <div className="md:col-span-3 mt-8 md:mt-0">
            <div className="grid grid-cols-12 md:grid-cols-3 gap-x-4 md:gap-x-[var(--column-spacing)] gap-y-6">
              <h2 className="section-label col-span-5 md:col-span-1 -mb-2">
                {t("about.roles")}
              </h2>
              <h2 className="section-label col-span-7 md:col-span-2 -mb-2">
                {t("about.description")}
              </h2>

              {roles.map((role) => (
                <div key={role} className="contents">
                  <div className="col-span-5 md:col-span-1 md:pr-6">
                    <h3 className="font-heading font-medium">
                      {t(`roles.${role}.title`, "about")}
                    </h3>
                    <p className="label-mono whitespace-nowrap shrink-0">
                      {t(`roles.${role}.period`, "about")}
                    </p>
                  </div>
                  <div className="col-span-7 md:col-span-2">
                    <p className="font-body text-primary">
                      {tHtml(`roles.${role}.description`, "about")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
