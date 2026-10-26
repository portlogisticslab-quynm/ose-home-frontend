import type { ArticleSummary, ArticlesIndex, CategoryItem, Lang } from "./types";
import index from "../data/articles.index.json";

/** Bundled list (summaries only, written by scripts/fetch-content.mjs at build time). */
export const articlesIndex = index as ArticlesIndex;

/** An article has an English version when both its title and body were translated. */
export function hasEn(a: { title_en: string; body_en?: string; summary_en?: string }): boolean {
  return Boolean(a.title_en && a.title_en.trim());
}

export function title(a: ArticleSummary, lang: Lang): string {
  return lang === "en" && hasEn(a) ? a.title_en : a.title_vi;
}

export function summary(a: ArticleSummary, lang: Lang): string {
  return (lang === "en" && hasEn(a) ? a.summary_en : a.summary_vi) || "";
}

export function seoTitle(a: ArticleSummary, lang: Lang): string {
  return (lang === "en" ? a.seo_title_en : a.seo_title_vi) || title(a, lang);
}

export function minutes(a: ArticleSummary, lang: Lang): number {
  return (lang === "en" ? a.minutes_en : a.minutes_vi) || 1;
}

/** Articles shown for a language: every article in Vietnamese, only translated ones in English. */
export function forLang(list: ArticleSummary[], lang: Lang): ArticleSummary[] {
  return lang === "en" ? list.filter(hasEn) : list;
}

export function categoryOf(cats: CategoryItem[], slug: string | null): CategoryItem | undefined {
  return slug ? cats.find((c) => c.slug === slug) : undefined;
}

export function categoryName(c: CategoryItem | undefined, lang: Lang): string {
  return c ? (lang === "en" ? c.name_en : c.name_vi) : "";
}

/** Cover image URL usable in <img src>. Uploaded images are served by the site itself (/media/…). */
export function coverSrc(cover: string, mediaBase = ""): string {
  if (!cover) return "";
  return cover.startsWith("/media/") ? mediaBase + cover : cover;
}

/** Articles of the same category first, then the newest others. */
export function related(all: ArticleSummary[], current: ArticleSummary, n = 3): ArticleSummary[] {
  const others = all.filter((a) => a.slug !== current.slug);
  const same = others.filter((a) => current.category && a.category === current.category);
  const rest = others.filter((a) => !same.includes(a));
  return [...same, ...rest].slice(0, n);
}

/** Lower-case, accent-free text for searching ("cảng" matches "cang"). */
export function fold(s: string): string {
  return s.replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
