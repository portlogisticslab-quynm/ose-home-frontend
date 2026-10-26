import { useEffect, useState } from "react";
import type { Lang } from "../lib/types";
import { articlesPath, homePath, t, type Key } from "../lib/i18n";
import { IconClose, IconMenu, IconShield, Logo } from "./Icons";

const NAV: Array<[string, Key]> = [
  ["software", "nav.software"],
  ["guides", "nav.guides"],
  ["demo", "nav.demo"],
  ["courses", "nav.courses"],
  ["articles", "nav.articles"],
  ["about", "nav.about"],
];

interface Props {
  lang: Lang;
  /** "home": section links scroll on the page; "articles": they go back to the home page. */
  page?: "home" | "articles";
  /** Link of the same page in the other language (default: the other home page). */
  altHref?: string;
}

export default function Header({ lang, page = "home", altHref }: Props) {
  const solid = page !== "home";
  const href = (id: string) => (id === "articles" ? articlesPath(lang) : page === "home" ? `#${id}` : `${homePath(lang)}#${id}`);
  const current = (id: string) => (page === "articles" && id === "articles" ? { "aria-current": "page" as const } : {});
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const other: Lang = lang === "vi" ? "en" : "vi";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid || scrolled || open ? "bg-ink-950/95 backdrop-blur border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6">
        <a href={homePath(lang)} className="flex items-center gap-2.5 text-white" aria-label="OSE — Open Solutions for Engineering">
          <Logo size={32} />
          <span className="leading-tight">
            <span className="block text-[17px] font-bold tracking-tight">OSE</span>
            <span className="block font-mono text-[9.5px] uppercase tracking-[.14em] text-sonar-300">Open Solutions for Engineering</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map(([id, key]) => (
            <a key={id} href={href(id)} {...current(id)}
              className={`rounded-md px-3 py-2 text-sm transition hover:bg-white/10 hover:text-white ${current(id)["aria-current"] ? "bg-white/10 text-white" : "text-white/80"}`}>
              {t(lang, key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={altHref ?? homePath(other)} hrefLang={other} lang={other}
            className="rounded-md border border-white/20 px-2.5 py-1.5 font-mono text-xs font-medium text-white/90 transition hover:border-white/50 hover:text-white"
            title={t(lang, "nav.lang")}>
            {other.toUpperCase()}
          </a>
          <a href="/admin/" rel="nofollow"
            className="hidden items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20 sm:inline-flex">
            <IconShield size={16} /> {t(lang, "nav.admin")}
          </a>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-nav"
            className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden" aria-label={t(lang, "nav.menu")}>
            {open ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-white/10 px-4 pb-4 lg:hidden" aria-label="Mobile">
          {NAV.map(([id, key]) => (
            <a key={id} href={href(id)} {...current(id)} onClick={() => setOpen(false)}
              className="block border-b border-white/5 py-3 text-base text-white/90">
              {t(lang, key)}
            </a>
          ))}
          <a href="/admin/" rel="nofollow" className="mt-3 inline-flex items-center gap-2 text-sm text-sonar-300">
            <IconShield size={16} /> {t(lang, "nav.admin")}
          </a>
        </nav>
      )}
    </header>
  );
}
