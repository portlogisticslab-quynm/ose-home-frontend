import type { Catalog, DemoItem, Lang, Seed } from "./types";

export function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, "").split("/")[0];
}

export function detectPlatform(url: string): DemoItem["platform"] {
  const h = hostOf(url).toLowerCase();
  if (h.endsWith("youtube.com") || h === "youtu.be") return "youtube";
  if (h === "lnkd.in" || h.endsWith("linkedin.com")) return "linkedin";
  if (h.endsWith("facebook.com") || h === "fb.watch") return "facebook";
  if (h.endsWith("drive.google.com")) return "drive";
  return "web";
}

export function youtubeId(url: string): string | null {
  const m =
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Converts the seed/export JSON into the same shape the API returns. Mirrors backend build_catalog(). */
export function seedToCatalog(seed: Seed): Catalog {
  let id = 1;
  const groups = seed.groups
    .filter((g) => g.visible !== false)
    .map((g) => ({
      id: id++, slug: g.slug, code: g.code, icon: g.icon,
      name_vi: g.name_vi, name_en: g.name_en, desc_vi: g.desc_vi, desc_en: g.desc_en,
      apps: g.apps.filter((a) => a.visible !== false).map((a) => ({
        id: id++, slug: a.slug, name: a.name, url: a.url, locked: false, host: hostOf(a.url),
        desc_vi: a.desc_vi, desc_en: a.desc_en, access_level: a.access_level ?? "public",
        featured: !!a.featured,
        guides: (a.guides ?? []).filter((x) => x.visible !== false)
          .map((x) => ({ id: id++, title: x.title, url: x.url, lang: x.lang ?? "vi" })),
      })),
    }));
  return {
    version: null,
    access_mode: "open",
    groups,
    guides: [],
    demos: (seed.demos ?? []).filter((d) => d.visible !== false).map((d) => ({
      id: id++, title_vi: d.title_vi, title_en: d.title_en, url: d.url,
      desc_vi: d.desc_vi ?? "", desc_en: d.desc_en ?? "",
      platform: detectPlatform(d.url), youtube_id: youtubeId(d.url), app_slug: d.app_slug ?? null,
    })),
    courses: (seed.courses ?? []).filter((c) => c.visible !== false).map((c) => ({
      id: id++, title_vi: c.title_vi, title_en: c.title_en, url: c.url, desc_vi: c.desc_vi ?? "", desc_en: c.desc_en ?? "",
    })),
    links: (seed.links ?? []).filter((l) => l.visible !== false).map((l) => ({
      id: id++, kind: l.kind, label_vi: l.label_vi, label_en: l.label_en, url: l.url,
    })),
  };
}

/** Pick the localized field: pick(obj, "name", "en") -> obj.name_en */
export function pick<T extends object>(obj: T, field: string, lang: Lang): string {
  const rec = obj as Record<string, unknown>;
  return String(rec[`${field}_${lang}`] ?? rec[`${field}_vi`] ?? "");
}

export function stats(c: Catalog) {
  const apps = c.groups.reduce((n, g) => n + g.apps.length, 0);
  const guides = c.groups.reduce((n, g) => n + g.apps.reduce((m, a) => m + a.guides.length, 0), 0) + c.guides.length;
  return { apps, groups: c.groups.length, guides, demos: c.demos.length, courses: c.courses.length };
}

export function filterApps(c: Catalog, groupSlug: string, query: string, lang: Lang) {
  const q = query.trim().toLowerCase();
  return c.groups
    .filter((g) => groupSlug === "all" || g.slug === groupSlug)
    .map((g) => ({
      ...g,
      apps: g.apps.filter((a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.host.toLowerCase().includes(q) ||
        pick(a, "desc", lang).toLowerCase().includes(q) ||
        pick(g, "name", lang).toLowerCase().includes(q)),
    }))
    .filter((g) => g.apps.length > 0);
}

/** Global running number (1..n) of each app, as in the original catalogue table. */
export function appNumbers(c: Catalog): Record<string, number> {
  const out: Record<string, number> = {};
  let i = 1;
  c.groups.forEach((g) => g.apps.forEach((a) => { out[a.slug] = i++; }));
  return out;
}

/** Google Drive file id from /file/d/<id>/… or ?id=<id> links. */
export function driveId(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/) || url.match(/drive\.google\.com\/.*[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? m[1] : null;
}

/** First demo clip of each app, keyed by app slug. */
export function demosByApp(c: Catalog): Record<string, DemoItem> {
  const out: Record<string, DemoItem> = {};
  for (const d of c.demos) if (d.app_slug && !out[d.app_slug]) out[d.app_slug] = d;
  return out;
}
