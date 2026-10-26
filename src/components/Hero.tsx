import type { Catalog, Lang } from "../lib/types";
import { stats } from "../lib/catalog";
import { t } from "../lib/i18n";
import { IconArrowDown, IconPlay } from "./Icons";

function TerminalIllustration() {
  // Original line drawing of a container terminal: quay cranes, yard stacks, a vessel and a data route.
  const stack = (x: number, y: number, cols: number, rows: number, key: string) =>
    Array.from({ length: cols * rows }).map((_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const shade = ["#1F4561", "#2C5C7D", "#153247", "#E8613A"][(c * 3 + r * 5 + key.length) % 7 === 0 ? 3 : (c + r) % 3];
      return <rect key={`${key}${i}`} x={x + c * 26} y={y - (r + 1) * 12} width="24" height="10.5" rx="1" fill={shade} opacity={shade === "#E8613A" ? 0.9 : 0.85} />;
    });

  return (
    <svg viewBox="0 0 640 420" className="h-auto w-full" role="img" aria-label="Container terminal with quay cranes, yard stacks and a vessel">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#79D5CB" strokeOpacity=".08" />
        </pattern>
        <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1FA59A" stopOpacity=".22" />
          <stop offset="1" stopColor="#1FA59A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#grid)" />

      {/* yard stacks */}
      <g>{stack(330, 300, 4, 3, "a")}{stack(450, 300, 4, 4, "b")}{stack(560, 300, 3, 2, "c")}</g>

      {/* quay apron and water */}
      <path d="M0 300H640" stroke="#79D5CB" strokeOpacity=".5" />
      <rect x="0" y="300" width="640" height="120" fill="url(#water)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={i} d={`M${20 + i * 105} ${336 + (i % 2) * 18}h46`} stroke="#79D5CB" strokeOpacity=".25" strokeLinecap="round" />
      ))}

      {/* vessel */}
      <path d="M24 318h250l-18 34H48z" fill="#122C40" stroke="#79D5CB" strokeOpacity=".6" />
      <g>{stack(52, 318, 8, 3, "v")}</g>
      <rect x="236" y="262" width="26" height="56" fill="#122C40" stroke="#79D5CB" strokeOpacity=".6" />
      <path d="M241 272h16M241 282h16" stroke="#79D5CB" strokeOpacity=".5" />

      {/* quay cranes (STS) */}
      {[96, 196].map((x) => (
        <g key={x} stroke="#E8613A" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d={`M${x} 300V150M${x + 44} 300V150`} />
          <path d={`M${x - 70} 150H${x + 92}`} />
          <path d={`M${x} 150L${x + 22} 112L${x + 44} 150`} strokeWidth="2" />
          <path d={`M${x - 70} 150L${x + 22} 112L${x + 92} 150`} strokeWidth="1.2" strokeOpacity=".7" />
          <path d={`M${x} 228H${x + 44}`} strokeWidth="2" />
          <path d={`M${x - 36} 150v44`} stroke="#79D5CB" strokeWidth="1.2" />
          <rect x={x - 46} y="194" width="20" height="9" fill="#E8613A" stroke="none" />
        </g>
      ))}

      {/* data route between nodes */}
      <path d="M58 90C170 40 260 120 360 80S540 40 600 110" fill="none" stroke="#1FA59A" strokeWidth="1.6"
        strokeDasharray="5 7" className="motion-safe:animate-sweep" />
      {[[58, 90], [360, 80], [600, 110]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="9" fill="#1FA59A" fillOpacity=".15" className="motion-safe:animate-blink" style={{ animationDelay: `${i * 0.6}s` }} />
          <circle cx={cx} cy={cy} r="3.5" fill="#79D5CB" />
        </g>
      ))}

      {/* engineering readouts */}
      <g fontFamily="IBM Plex Mono, ui-monospace, monospace" fontSize="11" fill="#79D5CB">
        <text x="384" y="108">λ = 12.4 calls/day</text>
        <text x="476" y="148">ρ = 0.82 · W<tspan dy="3" fontSize="8">q</tspan><tspan dy="-3"> = 3.1 h</tspan></text>
        <text x="300" y="398">UKC ≥ 1.20 m</text>
        <text x="20" y="58" fillOpacity=".7">BERTH 01 — ETA 06:40</text>
      </g>
    </svg>
  );
}

export default function Hero({ lang, catalog }: { lang: Lang; catalog: Catalog }) {
  const s = stats(catalog);
  const items: Array<[string, string]> = [
    [String(s.apps), t(lang, "hero.stat.apps")],
    [String(s.groups), t(lang, "hero.stat.groups")],
    [String(s.guides), t(lang, "hero.stat.guides")],
    [t(lang, "hero.stat.free"), t(lang, "hero.stat.freeSub")],
  ];
  return (
    <section className="relative overflow-hidden bg-ink-950 pt-16 text-white" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_10%,rgba(31,165,154,.18),transparent)]" />
      <div className="relative mx-auto grid max-w-page items-center gap-10 px-4 pb-14 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        <div className="reveal">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sonar/40 bg-sonar/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[.16em] text-sonar-300">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" /> {t(lang, "hero.eyebrow")}
          </p>
          <h1 id="hero-title" className="text-[2.1rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.35rem]">
            {t(lang, "hero.title1")}{" "}
            <span className="text-signal">{t(lang, "hero.title2")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{t(lang, "hero.lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#software" className="inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-signal-600">
              {t(lang, "hero.cta1")} <IconArrowDown size={16} />
            </a>
            <a href="#demo" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60">
              <IconPlay size={14} /> {t(lang, "hero.cta2")}
            </a>
          </div>
        </div>
        <div className="reveal rounded-2xl border border-white/10 bg-ink-900/60 p-2 shadow-2xl sm:p-3" style={{ transitionDelay: "120ms" }}>
          <TerminalIllustration />
        </div>
      </div>
      <div className="relative border-t border-white/10 bg-ink-950/80">
        <dl className="mx-auto grid max-w-page grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
          {items.map(([v, label], i) => (
            <div key={i} className={`py-5 ${i % 2 ? "pl-5" : ""} ${i > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""} ${i < 2 ? "border-b border-white/10 md:border-b-0" : ""}`}>
              <dt className="sr-only">{label}</dt>
              <dd className={`whitespace-nowrap font-mono font-medium text-white sm:text-3xl ${v.length > 6 ? "text-lg leading-8 min-[400px]:text-xl" : "text-2xl"}`}>{v}</dd>
              <dd className="mt-1 text-xs uppercase tracking-wider text-white/55">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
