// Generates static, SEO-ready HTML after `vite build`:
//   dist/index.html, dist/en/index.html                       home page (vi / en)
//   dist/apps/<slug>/index.html (+ /en/…)                     share page of each app
//   dist/bai-viet/index.html, dist/en/articles/index.html     article list
//   dist/bai-viet/<slug>/index.html (+ /en/articles/<slug>/)  each article (English only when translated)
// plus sitemap.xml, rss.xml, en/rss.xml and robots.txt. Every page has its own <title>, description,
// canonical, hreflang, Open Graph / Twitter tags and JSON-LD, so links posted on Facebook, LinkedIn
// or Zalo show a proper preview card, and the whole public site works without the backend.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const SITE = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://ose.vn").replace(/\/$/, "");
const BRAND_HTML = "OSE — Open Solutions for Engineering";

const ssr = await import(pathToFileURL(resolve(root, "dist-ssr/entry-server.js")).href);
const template = readFileSync(resolve(dist, "index.html"), "utf-8");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const homePath = (lang) => (lang === "en" ? "/en/" : "/");
const appPath = (lang, slug) => `${lang === "en" ? "/en" : ""}/apps/${slug}/`;
const listPath = (lang) => (lang === "en" ? "/en/articles/" : "/bai-viet/");
const articlePath = (lang, slug) => `${listPath(lang)}${slug}/`;
const abs = (src) => (!src ? `${SITE}/og-image.png` : src.startsWith("/") ? SITE + src : src);

function head({ lang, title, description, url, alternates, type = "website", image, extra = [] }) {
  const alt = alternates
    ? [
        ...Object.entries(alternates).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}" />`),
        `<link rel="alternate" hreflang="x-default" href="${alternates.vi ?? url}" />`,
      ]
    : [];
  const img = abs(image);
  return [
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...alt,
    `<link rel="alternate" type="application/rss+xml" title="OSE" href="${SITE}${lang === "en" ? "/en" : ""}/rss.xml" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(BRAND_HTML)}" />`,
    `<meta property="og:locale" content="${lang === "vi" ? "vi_VN" : "en_US"}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    ...(image ? [] : [`<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`]),
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    ...extra,
  ].join("\n    ");
}

function page(lang, title, headHtml, body) {
  return template
    // function replacers: rendered HTML may contain "$" sequences
    .replace('<html lang="vi">', () => `<html lang="${lang}">`)
    .replace(/<title>.*?<\/title>/s, () => `<title>${esc(title)}</title>`)
    .replace("<!--head-meta-->", () => headHtml)
    .replace("<!--app-html-->", () => body);
}

function write(rel, html) {
  const file = resolve(dist, rel.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const urls = [];   // [path, priority, lastmod?]
const today = new Date().toISOString().slice(0, 10);

// ---- home + app share pages
for (const lang of ["vi", "en"]) {
  for (const slug of [undefined, ...ssr.appSlugs()]) {
    const p = slug ? appPath(lang, slug) : homePath(lang);
    const meta = ssr.pageMeta(lang, slug);
    const alternates = { vi: SITE + (slug ? appPath("vi", slug) : "/"), en: SITE + (slug ? appPath("en", slug) : "/en/") };
    const h = head({ lang, title: meta.title, description: meta.description, url: SITE + p, alternates,
      extra: slug ? [] : [`<script type="application/ld+json">${ssr.jsonLd(lang, SITE)}</script>`] });
    write(p, page(lang, meta.title, h, ssr.render(lang)));
    urls.push([p, slug ? "0.6" : lang === "vi" ? "1.0" : "0.9"]);
  }
}

// ---- article list
for (const lang of ["vi", "en"]) {
  const meta = ssr.articlesListMeta(lang);
  const p = listPath(lang);
  const h = head({ lang, title: meta.title, description: meta.description, url: SITE + p,
    alternates: { vi: SITE + listPath("vi"), en: SITE + listPath("en") } });
  write(p, page(lang, meta.title, h, ssr.renderArticlesList(lang)));
  urls.push([p, "0.8"]);
}

// ---- articles
const feed = { vi: [], en: [] };
for (const lang of ["vi", "en"]) {
  for (const slug of ssr.articleSlugs(lang)) {
    const meta = ssr.articleMeta(lang, slug);
    const p = articlePath(lang, slug);
    const alternates = ssr.articleHasEn(slug)
      ? { vi: SITE + articlePath("vi", slug), en: SITE + articlePath("en", slug) }
      : { vi: SITE + articlePath("vi", slug) };
    const ld = {
      "@context": "https://schema.org", "@type": "BlogPosting", headline: meta.title.replace(/ \| OSE$/, ""),
      description: meta.description, image: abs(meta.cover), datePublished: meta.published,
      dateModified: meta.modified || meta.published, inLanguage: lang === "vi" ? "vi-VN" : "en",
      author: { "@type": "Person", name: meta.author },
      publisher: { "@type": "Organization", name: "OSE", logo: { "@type": "ImageObject", url: `${SITE}/ose-logo-512.png` } },
      mainEntityOfPage: SITE + p, articleSection: meta.section || undefined, keywords: meta.tags.join(", ") || undefined,
    };
    const extra = [
      meta.published ? `<meta property="article:published_time" content="${esc(meta.published)}" />` : "",
      meta.modified ? `<meta property="article:modified_time" content="${esc(meta.modified)}" />` : "",
      meta.section ? `<meta property="article:section" content="${esc(meta.section)}" />` : "",
      ...meta.tags.map((t) => `<meta property="article:tag" content="${esc(t)}" />`),
      `<script type="application/ld+json">${json(ld)}</script>`,
      // Article data for hydration (the client bundle only carries summaries).
      `<script id="page-data" type="application/json">${json(meta.data)}</script>`,
    ].filter(Boolean);
    const h = head({ lang, title: meta.title, description: meta.description, url: SITE + p, alternates,
      type: "article", image: meta.cover || undefined, extra });
    write(p, page(lang, meta.title, h, ssr.renderArticle(lang, slug)));
    urls.push([p, "0.7", (meta.modified || meta.published || "").slice(0, 10)]);
    feed[lang].push({ ...meta, url: SITE + p });
  }
}

// ---- sitemap, RSS, robots
writeFileSync(resolve(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, pr, lm]) => `  <url><loc>${SITE}${u}</loc><lastmod>${lm || today}</lastmod><priority>${pr}</priority></url>`).join("\n") +
  `\n</urlset>\n`);

for (const lang of ["vi", "en"]) {
  const items = feed[lang].slice(0, 30).map((m) => `    <item>
      <title>${esc(m.title.replace(/ \| OSE$/, ""))}</title>
      <link>${m.url}</link>
      <guid isPermaLink="true">${m.url}</guid>
      ${m.published ? `<pubDate>${new Date(m.published).toUTCString()}</pubDate>` : ""}
      <description>${esc(m.description)}</description>
      ${m.section ? `<category>${esc(m.section)}</category>` : ""}
    </item>`).join("\n");
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>OSE — ${lang === "vi" ? "Bài viết" : "Articles"}</title>
    <link>${SITE}${listPath(lang)}</link>
    <description>${lang === "vi" ? "Kỹ thuật cảng, AI &amp; Logistics và phần mềm mới" : "Port engineering, AI &amp; Logistics and new software"}</description>
    <language>${lang === "vi" ? "vi" : "en"}</language>
${items}
  </channel>
</rss>
`;
  const file = resolve(dist, lang === "en" ? "en/rss.xml" : "rss.xml");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, rss);
}

writeFileSync(resolve(dist, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${SITE}/sitemap.xml\n`);

rmSync(resolve(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerender: ${urls.length} pages (${feed.vi.length} articles vi, ${feed.en.length} en), sitemap.xml, rss.xml -> ${SITE}`);
