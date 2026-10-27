"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import parse, { Element } from "html-react-parser";
import {
  useLanguage,
  type Language,
} from "@portfolio/lib/contexts/language-context";
import TextSkeleton from "@portfolio/ui/text-skeleton";

import { ImageContainer } from "@portfolio/ui/image-container";
import { CompareSlider } from "@portfolio/ui/compare-slider";
import { MarkdownChart } from "@portfolio/ui/charts/markdown-chart";
import type { PostMetadata } from "@portfolio/lib/lib/markdown";
import NextUpCard from "@portfolio/ui/next-up-card";
import { MetaList } from "@portfolio/ui/meta-list";

interface BlogPostClientProps {
  initialPost: PostMetadata & { contentHtml: string };
  nextPost?: {
    slug: string;
    title: string;
    category: string;
    imageUrl: string;
    aspectRatio?: number;
  } | null;
  localGraphSlot?: React.ReactNode;
}

export default function BlogPostClient({
  initialPost,
  nextPost,
  localGraphSlot,
}: BlogPostClientProps) {
  const { language, initialLanguage, t } = useLanguage();
  const [post, setPost] = useState(initialPost);
  // The language the loaded content is the right answer for. The page
  // server-renders the visitor's language, so on load this already matches
  // and nothing refetches; it only diverges when they hit the switcher.
  const [resolvedLanguage, setResolvedLanguage] =
    useState<Language>(initialLanguage);
  const baseSlug = post.slug.replace(/_zh-tw$/i, "");
  const targetSlug = language === "zh-TW" ? `${baseSlug}_zh-tw` : baseSlug;
  // Derived, so the skeleton appears on the very render the language changes
  // rather than a frame later via an effect. The slug comparison is the
  // effect's own fetch condition, so the skeleton shows exactly when there is
  // a round trip to wait for — switching back to a post that has no
  // translation, and so never left its base slug, doesn't blink.
  const isSwitchingLanguage =
    resolvedLanguage !== language && targetSlug !== post.slug;
  const [nextPostData, setNextPostData] = useState(nextPost);
  // Force scroll to top on navigation
  useLayoutEffect(() => {
    // Set scroll restoration to manual first
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    // Immediate scroll
    window.scrollTo(0, 0);
    // Backup scroll after any pending browser scroll restoration
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialPost.slug]);

  // Fetch localized version of the Next Up post
  useEffect(() => {
    async function fetchLocalizedNextPost() {
      if (!nextPost) return;

      const baseSlug = nextPost.slug.replace("_zh-tw", "");
      let targetSlug = baseSlug;

      if (language === "zh-TW") {
        targetSlug = `${baseSlug}_zh-tw`;
      }

      if (nextPostData && nextPostData.slug === targetSlug) return;

      try {
        const response = await fetch(`/api/posts/${targetSlug}`);
        if (response.ok) {
          const data = await response.json();
          setNextPostData({
            slug: data.slug,
            title: data.title,
            category: data.description, // Blog uses description as category in card
            imageUrl: data.imageUrl,
            aspectRatio: nextPost.aspectRatio, // Blog cards are 1.5
          });
        } else {
          if (language === "zh-TW" && targetSlug.includes("_zh-tw")) {
            const fallbackResponse = await fetch(`/api/posts/${baseSlug}`);
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              setNextPostData({
                slug: data.slug,
                title: data.title,
                category: data.description,
                imageUrl: data.imageUrl,
                aspectRatio: nextPost.aspectRatio,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching localized next post:", error);
      }
    }

    fetchLocalizedNextPost();
  }, [language, nextPost]);

  useEffect(() => {
    // The server already rendered this language; nothing to do until the
    // visitor actually switches.
    if (resolvedLanguage === language) return;

    // A quick en→zh→en toggle can land responses out of order; a superseded
    // one must not overwrite the language the user settled on.
    let cancelled = false;

    async function fetchLocalizedPost() {
      try {
        // Only fetch if we need a different version than what we currently have
        if (targetSlug !== post.slug) {
          const response = await fetch(`/api/posts/${targetSlug}`);
          if (cancelled) return;

          if (response.ok) {
            setPost(await response.json());
          } else if (language === "zh-TW") {
            // No translation for this one — fall back to the base version.
            const fallbackResponse = await fetch(`/api/posts/${baseSlug}`);
            if (cancelled) return;
            if (fallbackResponse.ok) {
              setPost(await fallbackResponse.json());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching localized version:", error);
        // Keep the current content on error
      } finally {
        // Cleared even on failure or when no translation exists, so neither
        // case leaves the article shimmering forever.
        if (!cancelled) setResolvedLanguage(language);
      }
    }

    fetchLocalizedPost();

    return () => {
      cancelled = true;
    };
  }, [language, resolvedLanguage, post.slug, baseSlug, targetSlug]);
  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === "zh-TW" ? "zh-TW" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderHtml = (html: string) =>
    parse(html, {
      replace: (domNode) => {
        if (
          domNode instanceof Element &&
          domNode.attribs?.class === "markdown-chart"
        ) {
          return (
            <MarkdownChart
              name={domNode.attribs["data-chart"]}
              lang={post.slug.endsWith("_zh-tw") ? "zh-TW" : "en"}
            />
          );
        }
        if (
          domNode instanceof Element &&
          domNode.attribs &&
          domNode.attribs.class === "markdown-compare-placeholder"
        ) {
          const {
            "data-left-src": leftSrc,
            "data-right-src": rightSrc,
            "data-alt": alt,
            "data-aspect-ratio": aspectRatio,
            "data-framed": framed,
          } = domNode.attribs;
          return (
            <CompareSlider
              leftSrc={leftSrc}
              rightSrc={rightSrc}
              alt={alt || ""}
              aspectRatio={aspectRatio ? parseFloat(aspectRatio) : undefined}
              noInsetPadding={framed !== "true"}
              quality={95}
            />
          );
        }
        if (
          domNode instanceof Element &&
          domNode.attribs &&
          domNode.attribs.class === "markdown-image-placeholder"
        ) {
          const {
            "data-src": src,
            "data-alt": alt,
            "data-aspect-ratio": aspectRatio,
            "data-framed": framed,
          } = domNode.attribs;
          return (
            <ImageContainer
              src={src}
              alt={alt || ""}
              aspectRatio={aspectRatio ? parseFloat(aspectRatio) : undefined}
              noInsetPadding={framed !== "true"}
              quality={95}
            />
          );
        }
      },
    });

  return (
    <div className="page-transition-enter">
      {/* Blog-only scroll-depth: 25/50/75/100 thresholds need a fresh look before extending to project/gallery. */}
      <div className="pb-12 pt-24 md:pt-32">
        <div className="container">
          {/* Header table: the title is its widest cell, so it shares the
              table's top rule instead of being aligned to it by eye. */}
          <div className="grid grid-cols-1 md:grid-cols-12 md:gap-x-12 mb-12 md:mb-16">
            <div className="md:col-span-8 py-3 border-t md:border-b border-border">
              <p className="font-heading uppercase text-xs tracking-wider text-secondary mb-1">
                {t("blog.titleLabel")}
              </p>
              <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight text-primary">
                {isSwitchingLanguage ? (
                  <TextSkeleton paragraphs={1} linesPerParagraph={1} />
                ) : (
                  post.title
                )}
              </h1>
            </div>

            <MetaList
              className="md:col-span-4"
              items={[
                post.description && {
                  label: t("blog.overview"),
                  value: isSwitchingLanguage ? (
                    <TextSkeleton paragraphs={1} linesPerParagraph={2} />
                  ) : (
                    post.description
                  ),
                },
                { label: t("blog.date"), value: formatDate(post.date) },
                post.tags?.length && {
                  label: t("blog.tags"),
                  value: post.tags.join(", "),
                },
              ]}
            />
          </div>

          {/* Hero image section - Full width 3:2 */}
          <div className="relative w-full mb-16 md:mb-24">
            <ImageContainer
              src={post.imageUrl}
              alt={post.title}
              priority={true}
              quality={85}
              noInsetPadding={true}
              aspectRatio={1.5}
            />
          </div>

          {/* Body: centered two-thirds column */}
          <div className="md:w-8/12 mx-auto">
            <div className="prose prose-lg max-w-none dark:prose-invert mb-16 md:mb-24">
              {isSwitchingLanguage ? (
                <TextSkeleton paragraphs={5} />
              ) : (
                renderHtml(post.contentHtml)
              )}
            </div>

            {/* Local Graph + Next Up Card (coupled) */}
            {localGraphSlot}

            {/* Standalone Next Up Card (fallback when no graph) */}
            {!localGraphSlot && nextPostData && (
              <NextUpCard
                title={nextPostData.title}
                category={nextPostData.category}
                slug={nextPostData.slug}
                imageUrl={nextPostData.imageUrl}
                basePath="blog"
                aspectRatio={nextPostData.aspectRatio}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
