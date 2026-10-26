import type { AppItem, DemoItem, GroupItem, Lang } from "../lib/types";
import { pick } from "../lib/catalog";
import { appPath, t } from "../lib/i18n";
import { absoluteUrl } from "../lib/share";
import { GroupIcon, IconArrowUpRight, IconBook, IconLock, IconPlay } from "./Icons";
import ShareMenu from "./ShareMenu";
import { track } from "../lib/track";

interface Props { lang: Lang; app: AppItem; group: GroupItem; no: number; highlighted?: boolean; demo?: DemoItem }

export default function AppCard({ lang, app, group, no, highlighted, demo }: Props) {
  const guide = app.guides[0];
  return (
    <article id={`app-${app.slug}`}
      className={`reveal group/card relative flex scroll-mt-24 flex-col rounded-xl border bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift ${
        highlighted ? "border-signal ring-2 ring-signal/30" : "border-line"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-sonar-300">
          <GroupIcon name={group.icon} size={20} />
        </div>
        <div className="flex items-center gap-1.5">
          {app.featured && (
            <span className="rounded bg-signal-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-signal-600">{t(lang, "sw.featured")}</span>
          )}
          <span className="font-mono text-[11px] text-mute">{group.code}·{String(no).padStart(2, "0")}</span>
        </div>
      </div>

      <h3 className="mt-4 text-[1.02rem] font-semibold leading-snug text-ink">{app.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{pick(app, "desc", lang)}</p>
      <p className="mt-3 truncate font-mono text-xs text-sonar">{app.host}</p>

      {(guide || demo) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {guide && (
            <a href={guide.url} target="_blank" rel="noopener noreferrer" title={guide.title}
              onClick={() => track("guide", app.slug, app.name, lang)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40 hover:bg-paper">
              <IconBook size={14} className="text-signal" /> {t(lang, "sw.guide")}
            </a>
          )}
          {demo && (
            <a href={demo.url} target="_blank" rel="noopener noreferrer" title={pick(demo, "title", lang)}
              onClick={() => track("demo", app.slug, app.name, lang)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40 hover:bg-paper">
              <IconPlay size={11} className="text-signal" /> {t(lang, "sw.demo")}
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-4">
        {app.locked || !app.url ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-paper px-3 py-2 text-sm text-mute">
            <IconLock size={15} /> {t(lang, "sw.locked")}
          </span>
        ) : (
          <a href={app.url} target="_blank" rel="noopener" onClick={() => track("app", app.slug, app.name, lang)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
            aria-label={`${t(lang, "sw.open")}: ${app.name}`}>
            {t(lang, "sw.open")} <IconArrowUpRight size={15} />
          </a>
        )}
        <div className="ml-auto">
          <ShareMenu lang={lang} url={absoluteUrl(appPath(lang, app.slug))} title={app.name} compact />
        </div>
      </div>
    </article>
  );
}
