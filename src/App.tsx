import { useEffect, useState } from "react";
import type { ArticlesIndex, Catalog, Lang } from "./lib/types";
import { apiFetch } from "./lib/api";
import Header from "./components/Header";
import Hero from "./components/Hero";
import SoftwareSection from "./components/SoftwareSection";
import GuidesSection from "./components/GuidesSection";
import DemoSection from "./components/DemoSection";
import CoursesSection from "./components/CoursesSection";
import AboutSection from "./components/AboutSection";
import ArticlesSection from "./components/ArticlesSection";
import { articlesIndex } from "./lib/articles";
import Footer from "./components/Footer";
import { useReveal } from "./lib/useReveal";

interface Props { lang: Lang; initial: Catalog; live?: boolean; articles?: ArticlesIndex }

/**
 * The landing page. `initial` is the bundled fallback catalog, so the server-rendered
 * HTML and the first client render are identical (no hydration mismatch). Live data
 * from the API replaces it after mount.
 */
export default function App({ lang, initial, live = true, articles = articlesIndex }: Props) {
  const [catalog, setCatalog] = useState<Catalog>(initial);
  const [offline, setOffline] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  useReveal();

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    apiFetch<Catalog>("/api/v1/catalog", { timeoutMs: 6000 })
      .then((c) => { if (!cancelled && c?.groups?.length) setCatalog(c); })
      .catch(() => { if (!cancelled) setOffline(true); });
    return () => { cancelled = true; };
  }, [live]);

  // Deep links shared on social media: /apps/<slug>/ or #app-<slug>
  useEffect(() => {
    const m = window.location.pathname.match(/\/apps\/([a-z0-9-]+)\/?$/) || window.location.hash.match(/^#app-([a-z0-9-]+)$/);
    if (!m) return;
    const slug = m[1];
    setFocus(slug);
    const tryScroll = (n: number) => {
      const el = document.getElementById(`app-${slug}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      else if (n > 0) setTimeout(() => tryScroll(n - 1), 300);
    };
    setTimeout(() => tryScroll(5), 250);
  }, []);

  return (
    <>
      <a href="#software" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header lang={lang} />
      <main>
        <Hero lang={lang} catalog={catalog} />
        <SoftwareSection lang={lang} catalog={catalog} focus={focus} />
        <GuidesSection lang={lang} catalog={catalog} />
        <DemoSection lang={lang} catalog={catalog} />
        <CoursesSection lang={lang} catalog={catalog} />
        <ArticlesSection lang={lang} data={articles} />
        <AboutSection lang={lang} catalog={catalog} />
      </main>
      <Footer lang={lang} catalog={catalog} offline={offline} />
    </>
  );
}
