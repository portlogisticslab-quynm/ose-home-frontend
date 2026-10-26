// Build-time renderer used by scripts/prerender.mjs (vite build --ssr).
import { renderToString } from "react-dom/server";
import App from "./App";
import ArticlesListPage from "./pages/ArticlesListPage";
import ArticlePage from "./pages/ArticlePage";
import seed from "./data/catalog.fallback.json";
import full from "./data/articles.full.json";
import { pick, seedToCatalog, stats } from "./lib/catalog";
import { articlesIndex, categoryName, categoryOf, forLang, hasEn, seoTitle, summary } from "./lib/articles";
import type { Article, Lang, Seed } from "./lib/types";

export const catalog = seedToCatalog(seed as Seed);
const articles = (full as { articles: Article[] }).articles;

export const BRAND = "OSE — Open Solutions for Engineering";

export function render(lang: Lang): string {
  return renderToString(<App lang={lang} initial={catalog} />);
}

export function renderArticlesList(lang: Lang): string {
  return renderToString(<ArticlesListPage lang={lang} data={articlesIndex} catalog={catalog} />);
}

export function renderArticle(lang: Lang, slug: string): string {
  const a = articles.find((x) => x.slug === slug);
  if (!a) throw new Error(`Unknown article ${slug}`);
  return renderToString(<ArticlePage lang={lang} article={a} index={articlesIndex} catalog={catalog} />);
}

export function pageMeta(lang: Lang, appSlug?: string) {
  const s = stats(catalog);
  const base = lang === "vi"
    ? {
        title: "OSE — Open Solutions for Engineering | Công cụ mở cho kỹ sư cảng và logistics",
        description: `OSE: ${s.apps} ứng dụng web về kỹ thuật cảng, luồng tàu và logistics, kèm tài liệu hướng dẫn, clip demo, khoá học và bài viết chuyên môn.`,
      }
    : {
        title: "OSE — Open Solutions for Engineering | Open tools for port and logistics engineers",
        description: `OSE: ${s.apps} web apps for port engineering, navigation channels and logistics, with user guides, demo clips, courses and technical articles.`,
      };
  if (!appSlug) return base;
  for (const g of catalog.groups) {
    const a = g.apps.find((x) => x.slug === appSlug);
    if (a) {
      return {
        title: `${a.name} | OSE`,
        description: `${pick(a, "desc", lang).replace(/\.$/, "")} — ${pick(g, "name", lang)}. ${lang === "vi" ? "Dùng trực tuyến tại" : "Online at"} ${a.host}.`,
      };
    }
  }
  return base;
}

export function articlesListMeta(lang: Lang) {
  return lang === "vi"
    ? { title: "Bài viết | OSE — Open Solutions for Engineering",
        description: "Bài viết về kỹ thuật cảng, AI & Logistics và giới thiệu phần mềm mới từ OSE." }
    : { title: "Articles | OSE — Open Solutions for Engineering",
        description: "Articles on port engineering, AI & Logistics and new software from OSE." };
}

export function articleMeta(lang: Lang, slug: string) {
  const a = articles.find((x) => x.slug === slug)!;
  const cat = categoryOf(articlesIndex.categories, a.category);
  return {
    title: `${seoTitle(a, lang)} | OSE`,
    description: (summary(a, lang) || seoTitle(a, lang)).slice(0, 300),
    cover: a.cover,
    published: a.published_at,
    modified: a.updated_at,
    author: a.author || "Nguyen Minh Quy",
    section: categoryName(cat, lang),
    tags: a.tags,
    data: a,
  };
}

export function appSlugs(): string[] {
  return catalog.groups.flatMap((g) => g.apps.map((a) => a.slug));
}

/** Articles to prerender per language (English only when translated). */
export function articleSlugs(lang: Lang): string[] {
  return forLang(articles, lang).map((a) => a.slug);
}

export function articleHasEn(slug: string): boolean {
  const a = articles.find((x) => x.slug === slug);
  return Boolean(a && hasEn(a));
}

export function jsonLd(lang: Lang, siteUrl: string): string {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite", "@id": `${siteUrl}/#website`, url: `${siteUrl}/`, name: BRAND,
        inLanguage: lang === "vi" ? "vi-VN" : "en",
      },
      {
        "@type": "Organization", "@id": `${siteUrl}/#org`, name: "OSE", alternateName: BRAND, url: `${siteUrl}/`,
        logo: `${siteUrl}/ose-logo-512.png`, founder: { "@id": `${siteUrl}/#author` },
      },
      {
        "@type": "Person", "@id": `${siteUrl}/#author`, name: "Nguyen Minh Quy",
        sameAs: catalog.links.filter((l) => /^https:/.test(l.url)).map((l) => l.url),
      },
      {
        "@type": "ItemList", name: lang === "vi" ? "Danh mục phần mềm" : "Software catalogue",
        itemListElement: catalog.groups.flatMap((g) => g.apps).map((a, i) => ({
          "@type": "ListItem", position: i + 1,
          item: {
            "@type": "SoftwareApplication", name: a.name, url: a.url, applicationCategory: "BusinessApplication",
            operatingSystem: "Web", description: pick(a, "desc", lang),
            offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
            author: { "@id": `${siteUrl}/#author` },
          },
        })),
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
