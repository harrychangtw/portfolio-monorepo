"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useIsMobile } from "@portfolio/lib/hooks/use-mobile";
import { useLanguage } from "@portfolio/lib/contexts/language-context";
import { useNowPlaying } from "@portfolio/lib/hooks/use-now-playing";
import NowPlayingIndicator from "@portfolio/ui/now-playing-indicator";
import NowPlayingCard from "@portfolio/ui/now-playing-card";
import { usePathname } from "next/navigation";
import { scrollToSection } from "@portfolio/lib/lib/scrolling";
import NavigationLink from "@portfolio/ui/navigation-link";
import MarqueeText from "@portfolio/ui/marquee-text";
import FooterBand from "@/components/footer-band";
import { ArrowUpRight } from "lucide-react";

const LanguageSwitcher = dynamic(
  () => import("@portfolio/ui/language-switcher"),
  { ssr: false },
);

const ThemeSwitcher = dynamic(() => import("@portfolio/ui/theme-switcher"), {
  ssr: false,
});

// --- Reorganized Link Data ---
const connectLinks = [
  { id: "gmail", name: "Email", href: "/email" },
  { id: "discord", name: "Discord", href: "/discord" },
  { id: "linkedin", name: "LinkedIn", href: "/linkedin" },
  { id: "github", name: "GitHub", href: "/github" },
  { id: "instagram", name: "Instagram", href: "/instagram" },
  { id: "medium", name: "Medium", href: "/medium" },
  // Two different things, deliberately adjacent: /cal is the read-only public
  // schedule, /meet is the booking link that redirects out to Notion Calendar.
  { id: "calendar", name: "Schedule", href: "/cal" },
  { id: "booking", name: "Book a Meeting", href: "/meet" },
];

const exploreLinks = [
  { id: "linktree", name: "Links", href: "/linktree" },
  { id: "music", name: "Music Playlists", href: "/spotify" },
  { id: "letterboxd", name: "Letterboxd", href: "/letterboxd" },
  { id: "resume", name: "Resume", href: "/cv" },
  { id: "uses", name: "Uses", href: "/uses" },
  { id: "design", name: "Design System", href: "/design" },
  { id: "graph", name: "Knowledge Graph", href: "/graph" },
  // href is swapped to the zh-TW feed at render time; see
  // `localizedExploreLinks` below.
  { id: "rss", name: "RSS Feed", href: "/feed.xml" },
];

const siteLinks = [
  { id: "about", name: "About", href: "/#about" },
  { id: "projects", name: "Projects", href: "/#projects" },
  { id: "gallery", name: "Gallery", href: "/#gallery" },
  { id: "blog", name: "Blog", href: "/blog" },
  { id: "privacy", name: "Privacy", href: "/privacy" },
  { id: "manifesto", name: "Manifesto", href: "/manifesto" },
  { id: "source", name: "Source Code", href: "/readme" },
  { id: "issues", name: "Report an Issue", href: "/issues" },
];

// Helper to get translation key based on link type
const getTranslationKey = (id: string) => {
  if (connectLinks.some((l) => l.id === id)) {
    return `social.${id}`;
  }
  if (exploreLinks.some((l) => l.id === id)) {
    // Map to existing translation keys
    const socialIds = ["music", "letterboxd"];
    if (socialIds.includes(id)) return `social.${id}`;
    return `resources.${id}`;
  }
  if (siteLinks.some((l) => l.id === id)) {
    const headerIds = ["about", "projects", "gallery", "blog"];
    if (headerIds.includes(id)) return `header.${id}`;
    return `resources.${id}`;
  }
  return id;
};

export default function Footer() {
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isLab, setIsLab] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  const hoveringMusic = activeTooltipId === "music";
  const { data: nowPlaying } = useNowPlaying(hoveringMusic ? 10000 : 600000, {
    fresh: hoveringMusic,
  });

  const isMusicTooltip = hoveringMusic && nowPlaying?.isPlaying;

  useEffect(() => {
    setIsClient(true); // eslint-disable-line react-hooks/set-state-in-effect -- client detection on mount
    const hostname = window.location.hostname;
    setIsLab(hostname.startsWith("lab."));
  }, []);

  const handleMouseEnter = (e: React.MouseEvent, id: string) => {
    if (!isMobile) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
      setActiveTooltipId(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMobile && activeTooltipId) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveTooltipId(null);
    }
  };

  // The blog ships one feed per language; point readers at the one matching
  // the site language they are already browsing in.
  const localizedExploreLinks = exploreLinks.map((link) =>
    link.id === "rss" && language === "zh-TW"
      ? { ...link, href: "/feed-zh-tw.xml" }
      : link,
  );

  const isInternalLink = (href: string) => href.startsWith("/");
  const isAnchorLink = (href: string) => href.includes("#");

  const getHref = (href: string) => {
    if (!isClient) return href;

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";

    if (isLab && isInternalLink(href)) {
      let mainDomain = hostname.replace(/^lab\./, "");
      if (!mainDomain.includes("localhost") && !mainDomain.startsWith("www.")) {
        mainDomain = `www.${mainDomain}`;
      }
      return `${protocol}//${mainDomain}${port}${href}`;
    }

    return href;
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (isLab) return;

    if (isAnchorLink(href) && pathname === "/") {
      const id = href.split("#")[1];
      if (id) scrollToSection(id, e);
    }
  };

  // Reusable link renderer
  const renderLink = (
    link: (typeof connectLinks)[0],
    showNowPlaying = false,
  ) => {
    const href = getHref(link.href);
    const isInternal = isInternalLink(link.href);
    const linkClassName =
      "font-ibm-plex text-primary transition-colors flex items-center justify-between w-full group hover:text-accent";

    const label =
      showNowPlaying && link.id === "music" ? (
        <span className="inline-flex items-center">
          {t(getTranslationKey(link.id))}
          <NowPlayingIndicator isPlaying={nowPlaying?.isPlaying} />
        </span>
      ) : (
        t(getTranslationKey(link.id))
      );

    const linkContent = (
      <>
        {/* One line, like the blog card titles: fades at the edge when it
            doesn't fit and scrolls while the row is hovered. */}
        <MarqueeText
          active={activeTooltipId === link.id}
          title={t(getTranslationKey(link.id))}
          className="min-w-0 flex-1 mr-3"
        >
          {label}
        </MarqueeText>
        <ArrowUpRight className="shrink-0 w-4 h-4 text-secondary transition-all duration-300 group-hover:text-accent group-hover:translate-x-0.5" />
      </>
    );

    return (
      <li key={link.id}>
        <motion.div whileHover={{ y: -2, x: 4 }} transition={{ duration: 0.2 }}>
          {isInternal ? (
            <NavigationLink
              href={href}
              className={linkClassName}
              onClick={(e) => {
                if (isAnchorLink(link.href)) handleNavClick(e, link.href);
              }}
              onMouseEnter={(e) => handleMouseEnter(e, link.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {linkContent}
            </NavigationLink>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              onMouseEnter={(e) => handleMouseEnter(e, link.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {linkContent}
            </a>
          )}
        </motion.div>
      </li>
    );
  };

  return (
    <>
      <FooterBand />
      <footer
        id="site-footer"
        ref={footerRef}
        className="bg-card text-primary py-12 md:py-16"
      >
        <div className="container">
          {/* The left half is pure negative space; links take the right. No
              column gap, so Socials starts exactly on the midline, the same
              line the guestbook box in the band above starts on. */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10">
            <div className="md:col-start-7 md:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
              <div>
                <h3 className="section-label mb-4">
                  {t("footer.socialContact")}
                </h3>
                <ul className="space-y-3">
                  {connectLinks.map((link) => renderLink(link))}
                </ul>
              </div>

              <div>
                <h3 className="section-label mb-4">
                  {t("footer.personalResources")}
                </h3>
                <ul className="space-y-3">
                  {localizedExploreLinks.map((link) => renderLink(link, true))}
                </ul>
              </div>

              {/* Site map: hidden on mobile, where the header menu covers it */}
              <div className="hidden md:block">
                <h3 className="section-label mb-4">
                  {t("footer.siteNavigation")}
                </h3>
                <ul className="space-y-3">
                  {siteLinks.map((link) => renderLink(link))}
                </ul>
              </div>
            </div>
          </div>

          {/* Final row under everything */}
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            <span className="font-body text-sm text-secondary">
              © {new Date().getFullYear()} Harry Chang
            </span>
          </div>
        </div>
      </footer>

      {/* Tooltip */}
      {activeTooltipId && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-50"
          style={
            isMusicTooltip
              ? {
                  top: tooltipPosition.y - 120,
                  left: tooltipPosition.x,
                  transform: "translate(15px, calc(-100% - 15px))",
                  pointerEvents: "none",
                }
              : {
                  top: tooltipPosition.y - 40,
                  left: tooltipPosition.x,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }
          }
        >
          {isMusicTooltip ? (
            <NowPlayingCard
              key={nowPlaying?.songUrl ?? nowPlaying?.title ?? "np"}
              data={nowPlaying}
            />
          ) : (
            <div className="bg-accent text-background text-sm px-3 py-1.5 rounded-md shadow-lg font-heading">
              {t(`tooltips.${activeTooltipId}`)}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
