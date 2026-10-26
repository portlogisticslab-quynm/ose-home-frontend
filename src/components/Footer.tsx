import type { Catalog, Lang } from "../lib/types";
import { pick } from "../lib/catalog";
import { homePath, t } from "../lib/i18n";
import { SITE_URL, absoluteUrl } from "../lib/share";
import { LinkKindIcon, Logo } from "./Icons";
import ShareMenu from "./ShareMenu";

export default function Footer({ lang, catalog, offline }: { lang: Lang; catalog: Catalog; offline: boolean }) {
  return (
    <footer className="bg-ink-950 text-white/70">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <p className="font-semibold text-white">OSE — Open Solutions for Engineering</p>
            <p className="text-sm text-white/60">{t(lang, "ft.slogan")}</p>
            <p className="font-mono text-xs text-white/40">{SITE_URL.replace(/^https?:\/\//, "")} · *.ose.vn</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {catalog.links.map((l) => (
            <a key={l.id} href={l.url} {...(/^(mailto|tel):/i.test(l.url) ? {} : { target: "_blank", rel: "noopener noreferrer" })} aria-label={pick(l, "label", lang)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/80 transition hover:border-white/40 hover:text-white">
              <LinkKindIcon kind={l.kind} size={18} />
            </a>
          ))}
          <span className="mx-1 h-6 w-px bg-white/15" />
          <span className="text-sm">{t(lang, "ft.share")}</span>
          <ShareMenu lang={lang} url={absoluteUrl(homePath(lang))} title="OSE — Open Solutions for Engineering" dark compact />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Nguyen Minh Quy — OSE. {t(lang, "ft.rights")}</p>
          {offline && <p className="text-signal">{t(lang, "ft.offline")}</p>}
        </div>
      </div>
    </footer>
  );
}
