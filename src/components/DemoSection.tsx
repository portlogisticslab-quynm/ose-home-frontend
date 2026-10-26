import { useMemo, useState } from "react";
import type { Catalog, DemoItem, Lang } from "../lib/types";
import { appNumbers, driveId, pick } from "../lib/catalog";
import { t } from "../lib/i18n";
import { GroupIcon, IconArrowUpRight, IconFacebook, IconLinkedIn, IconPlay, IconYouTube } from "./Icons";
import SectionHeading from "./SectionHeading";
import { track, urlKey } from "../lib/track";

const PLATFORM: Record<DemoItem["platform"], string> = {
  youtube: "YouTube", linkedin: "LinkedIn", facebook: "Facebook", drive: "Google Drive", web: "Web",
};
const PAGE = 6; // cards shown before "Show more"

function PlatformIcon({ p }: { p: DemoItem["platform"] }) {
  if (p === "youtube") return <IconYouTube size={18} />;
  if (p === "linkedin") return <IconLinkedIn size={18} />;
  if (p === "facebook") return <IconFacebook size={18} />;
  return <IconPlay size={16} />;
}

function Poster({ index, platform, thumb, onThumbError }: {
  index: number; platform: DemoItem["platform"]; thumb?: string | null; onThumbError?: () => void;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-900">
      <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`pg${index}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#79D5CB" strokeOpacity=".09" /></pattern>
        </defs>
        <rect width="320" height="180" fill={`url(#pg${index})`} />
        <path d={`M0 ${130 - (index % 4) * 8}C80 ${90 + (index % 3) * 10} 150 150 220 ${100 - (index % 5) * 6}S300 70 320 ${80 + (index % 4) * 6}`} fill="none" stroke="#1FA59A" strokeWidth="1.5" strokeDasharray="4 6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={24 + i * 22} y={150 - ((i * 7 + index * 5) % 4) * 11} width="18" height="9" fill={i === (index % 5) + 1 ? "#E8613A" : "#2C5C7D"} />
        ))}
      </svg>
      {/* Thumbnail on top of the drawn poster: if it never loads, the poster still shows */}
      {thumb && (
        <img src={thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          onError={onThumbError} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-ink shadow-lift transition group-hover/demo:scale-105">
          <PlatformIcon p={platform} />
        </span>
      </span>
    </div>
  );
}

/**
 * Click-to-play player. Nothing heavy loads until the visitor presses play:
 * YouTube and Google Drive show a thumbnail, then swap in their embed player.
 * Other platforms (LinkedIn, Facebook) cannot be embedded and open in a new tab.
 */
function Player({ demo, index, title, lang }: { demo: DemoItem; index: number; title: string; lang: Lang }) {
  const [play, setPlay] = useState(false);
  const log = () => track("demo", demo.app_slug || urlKey("demo", demo.url), title, lang);
  const [thumbOk, setThumbOk] = useState(true);
  const yt = demo.platform === "youtube" ? demo.youtube_id : null;
  const drive = demo.platform === "drive" ? driveId(demo.url) : null;

  if (play && (yt || drive)) {
    const src = yt
      ? `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`
      : `https://drive.google.com/file/d/${drive}/preview`;
    return <iframe className="absolute inset-0 h-full w-full" src={src} title={title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />;
  }
  const thumb = !thumbOk ? null
    : yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`
    : drive ? `https://drive.google.com/thumbnail?id=${drive}&sz=w640` : null;

  if (yt || drive) {
    return (
      <button type="button" onClick={() => { setPlay(true); log(); }} className="absolute inset-0" aria-label={`${t(lang, "dm.play")}: ${title}`}>
        <Poster index={index} platform={demo.platform} thumb={thumb} onThumbError={() => setThumbOk(false)} />
      </button>
    );
  }
  return (
    <a href={demo.url} target="_blank" rel="noopener noreferrer" onClick={log} aria-label={`${t(lang, "dm.watchOn")} ${PLATFORM[demo.platform]}: ${title}`}>
      <Poster index={index} platform={demo.platform} />
    </a>
  );
}

export default function DemoSection({ lang, catalog }: { lang: Lang; catalog: Catalog }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const numbers = useMemo(() => appNumbers(catalog), [catalog]);

  // app slug -> { app name, group }
  const appIndex = useMemo(() => {
    const m: Record<string, { name: string; group: Catalog["groups"][number] }> = {};
    catalog.groups.forEach((g) => g.apps.forEach((a) => { m[a.slug] = { name: a.name, group: g }; }));
    return m;
  }, [catalog]);

  const groupOf = (d: DemoItem) => (d.app_slug && appIndex[d.app_slug] ? appIndex[d.app_slug].group.slug : "general");
  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; icon?: string; count: number }> = [];
    catalog.groups.forEach((g) => {
      const n = catalog.demos.filter((d) => groupOf(d) === g.slug).length;
      if (n) out.push({ key: g.slug, label: pick(g, "name", lang), icon: g.icon, count: n });
    });
    const general = catalog.demos.filter((d) => groupOf(d) === "general").length;
    if (general) out.push({ key: "general", label: t(lang, "dm.general"), count: general });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, lang, appIndex]);

  const list = catalog.demos.filter((d) => filter === "all" || groupOf(d) === filter);
  const shown = filter === "all" && !expanded ? list.slice(0, PAGE) : list;

  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
      active ? "border-white bg-white text-ink" : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"}`;

  return (
    <section id="demo" className="scroll-mt-16 bg-ink-950 py-20 sm:py-24" aria-labelledby="demo-title">
      <div className="mx-auto max-w-page px-4 sm:px-6">
        <SectionHeading id="demo" dark kicker={t(lang, "dm.kicker")} title={t(lang, "dm.title")} lead={t(lang, "dm.lead")} />
        {catalog.demos.length === 0 && <p className="text-white/60">{t(lang, "dm.empty")}</p>}

        {chips.length > 1 && (
          <div className="reveal -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t(lang, "dm.title")}>
            <button type="button" role="tab" aria-selected={filter === "all"} className={chip(filter === "all")} onClick={() => setFilter("all")}>
              {t(lang, "sw.all")} <span className="font-mono text-xs opacity-60">{catalog.demos.length}</span>
            </button>
            {chips.map((c) => (
              <button key={c.key} type="button" role="tab" aria-selected={filter === c.key} className={chip(filter === c.key)}
                onClick={() => setFilter(c.key)}>
                {c.icon && <GroupIcon name={c.icon} size={16} />}
                {c.label} <span className="font-mono text-xs opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d, i) => {
            const app = d.app_slug ? appIndex[d.app_slug] : undefined;
            const title = app ? app.name : pick(d, "title", lang);
            const desc = pick(d, "desc", lang);
            return (
              <article key={d.id} id={d.app_slug ? `demo-${d.app_slug}` : undefined}
                className="reveal group/demo scroll-mt-24 overflow-hidden rounded-xl border border-white/10 bg-ink-900">
                <div className="relative aspect-video">
                  <Player demo={d} index={i} title={title} lang={lang} />
                </div>
                <div className="p-4">
                  {app && (
                    <p className="mb-1 font-mono text-[11px] text-sonar-300">
                      {app.group.code}·{String(numbers[d.app_slug!]).padStart(2, "0")} — {pick(app.group, "name", lang)}
                    </p>
                  )}
                  <h3 className="font-semibold leading-snug text-white">{title}</h3>
                  {desc && <p className="mt-1 text-sm text-white/65">{desc}</p>}
                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                    onClick={() => track("demo", d.app_slug || urlKey("demo", d.url), title, lang)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-sonar-300 hover:text-white">
                    {t(lang, "dm.watchOn")} {PLATFORM[d.platform]} <IconArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {filter === "all" && list.length > PAGE && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/60">
              {expanded ? t(lang, "dm.less") : `${t(lang, "dm.more")} (${list.length - PAGE})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
