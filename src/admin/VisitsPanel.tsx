import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { appNumbers, seedToCatalog } from "../lib/catalog";
import type { Catalog, Seed } from "../lib/types";
import seed from "../data/catalog.fallback.json";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn, inputCls } from "./ui";

/* ------------------------------------------------------------------ API shape (backend app/visits.py) */

type SourceKey = "hub" | "ose" | "search" | "social" | "direct" | "other";
interface HostStat {
  host: string; visits: number; visitors: number; new_visitors: number; returning_visitors: number;
  active_days: number; sources: Record<SourceKey, number>;
  prev_visitors: number | null; prev_visits: number | null; last: string | null;
}
interface VisitStats {
  days: number; since: string | null; until: string; prev_since: string | null; prev_until: string | null;
  first_day: string | null;
  totals: { visits: number; visitors: number; new_visitors: number; multi_app_visitors: number };
  hosts: HostStat[];
  daily: Record<string, Record<string, number>>;
  countries: Array<{ country: string; visitors: number }>;
  other_refs: Array<{ ref: string; visits: number }>;
}

/* ------------------------------------------------------------------ constants */

const PERIODS: Array<[number, string]> = [[7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"], [365, "12 tháng"], [0, "Từ đầu"]];
const HUB_HOST = "ose.vn";
const SOURCES: Array<{ key: SourceKey; label: string; cls: string }> = [
  { key: "hub", label: "Qua hub", cls: "bg-sonar" },
  { key: "ose", label: "Từ app khác", cls: "bg-sonar-300" },
  { key: "search", label: "Tìm kiếm", cls: "bg-ink-600" },
  { key: "social", label: "Mạng xã hội", cls: "bg-signal" },
  { key: "direct", label: "Vào thẳng", cls: "bg-ink-950/25" },
  { key: "other", label: "Trang khác", cls: "bg-mute/50" },
];
const SORTS: Array<[SortKey, string]> = [["visitors", "Người truy cập"], ["growth", "Tăng trưởng"], ["visits", "Lượt truy cập"], ["returning", "Quay lại"], ["no", "Số thứ tự"]];
type SortKey = "visitors" | "growth" | "visits" | "returning" | "no";

const THRESHOLD_KEY = "osevn-admin-paywall-threshold";
function loadThreshold(): number {
  try { const n = Number(localStorage.getItem(THRESHOLD_KEY)); return n > 0 ? n : 50; } catch { return 50; }
}

interface Row {
  key: string; host: string; no: number | null; code: string; name: string;
  s: HostStat | null; growth: number | null; series: number[];
}

const fmt = (n: number) => n.toLocaleString("vi-VN");
const normHost = (h: string) => h.toLowerCase().replace(/^www\./, "").replace(/\/.*$/, "");

/** Growth vs previous period, in %. null = no comparison possible. Infinity = new (0 → >0). */
function growthOf(s: HostStat | null): number | null {
  if (!s || s.prev_visitors === null) return null;
  if (s.prev_visitors === 0) return s.visitors > 0 ? Infinity : null;
  return ((s.visitors - s.prev_visitors) / s.prev_visitors) * 100;
}

/** Day labels (YYYY-MM-DD) from since..until inclusive, at most `max` most recent. */
function dayRange(since: string | null, until: string, max: number): string[] {
  if (!since) return [];
  const out: string[] = [];
  const end = new Date(until + "T00:00:00Z");
  const start = new Date(since + "T00:00:00Z");
  for (let d = end; d >= start && out.length < max; d = new Date(d.getTime() - 86400000)) out.push(d.toISOString().slice(0, 10));
  return out.reverse();
}

/* ------------------------------------------------------------------ small visuals */

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2 || values.every((v) => v === 0)) return <span className="text-xs text-mute">—</span>;
  const w = 96, h = 24, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-sonar" aria-hidden="true">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="currentColor" fillOpacity="0.12" stroke="none" />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function SourceBar({ s }: { s: HostStat }) {
  const total = SOURCES.reduce((n, x) => n + s.sources[x.key], 0);
  if (!total) return <span className="text-xs text-mute">—</span>;
  const title = SOURCES.filter((x) => s.sources[x.key]).map((x) => `${x.label}: ${s.sources[x.key]}`).join(" · ");
  return (
    <span className="flex h-2.5 w-28 overflow-hidden rounded-full bg-paper" title={title}>
      {SOURCES.map((x) => s.sources[x.key] > 0 && (
        <span key={x.key} className={x.cls} style={{ width: `${(s.sources[x.key] / total) * 100}%` }} />
      ))}
    </span>
  );
}

function Growth({ g }: { g: number | null }) {
  if (g === null) return <span className="text-mute">—</span>;
  if (g === Infinity) return <span className="rounded bg-sonar-100 px-1.5 py-0.5 text-[11px] font-medium text-ink">mới</span>;
  const r = Math.round(g);
  const cls = r > 0 ? "text-sonar" : r < 0 ? "text-signal-600" : "text-mute";
  return <span className={`font-mono tabular-nums ${cls}`}>{r > 0 ? "▲" : r < 0 ? "▼" : ""}{Math.abs(r)}%</span>;
}

/* ------------------------------------------------------------------ panel */

/** Visitors per app (every *.ose.vn app that loads /ose-track.js), for deciding which apps to charge for. */
export default function VisitsPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [days, setDays] = useState(30);
  const [sort, setSort] = useState<SortKey>("visitors");
  const [threshold, setThreshold] = useState(loadThreshold);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [catalog, setCatalog] = useState<Catalog>(() => seedToCatalog(seed as Seed));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setStats(await apiFetch<VisitStats>(`/api/v1/admin/stats/visits?days=${days}`, { token: session.token, timeoutMs: 15000 }));
      setErr("");
    } catch (e) {
      onAuthError(e);
      const msg = e instanceof Error ? e.message : String(e);
      setErr(/404|Not Found/i.test(msg)
        ? "Máy chủ chưa có chức năng đếm truy cập (cần cập nhật backend có app/visits.py)."
        : msg);
    } finally { setBusy(false); }
  }, [days, session.token, onAuthError]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiFetch<Catalog>("/api/v1/catalog").then((c) => c?.groups?.length && setCatalog(c)).catch(() => {}); }, []);
  useEffect(() => { try { localStorage.setItem(THRESHOLD_KEY, String(threshold)); } catch { /* ignore */ } }, [threshold]);

  const { rows, unknown, appsWithUsers, appCount } = useMemo(() => {
    const byHost = new Map<string, HostStat>();
    (stats?.hosts ?? []).forEach((h) => byHost.set(normHost(h.host), h));
    const labels = stats ? dayRange(stats.since, stats.until, Math.min(stats.days || 60, 90)) : [];
    const seriesOf = (host: string) => labels.map((d) => stats?.daily?.[host]?.[d] ?? 0);
    const nums = appNumbers(catalog);
    const used = new Set<string>();

    const make = (key: string, host: string, no: number | null, code: string, name: string): Row => {
      used.add(host);
      const s = byHost.get(host) ?? null;
      return { key, host, no, code, name, s, growth: growthOf(s), series: s ? seriesOf(s.host) : [] };
    };
    const appRows: Row[] = catalog.groups.flatMap((g) => g.apps.map((a) =>
      make(a.slug, normHost(a.host || a.url || ""), nums[a.slug], g.code, a.name)));
    const hub = make("_hub", HUB_HOST, null, "HUB", "Trang chủ OSE");
    const extra: Row[] = [...byHost.keys()].filter((h) => !used.has(h)).map((h) => make(`_x_${h}`, h, null, "—", h));

    const val = (r: Row): number => {
      switch (sort) {
        case "visits": return r.s?.visits ?? -1;
        case "returning": return r.s?.returning_visitors ?? -1;
        case "growth": return r.growth === null ? -Infinity : r.growth === Infinity ? 1e9 + (r.s?.visitors ?? 0) : r.growth;
        case "no": return -(r.no ?? 999);
        default: return r.s?.visitors ?? -1;
      }
    };
    appRows.sort((x, y) => val(y) - val(x) || (y.s?.visitors ?? 0) - (x.s?.visitors ?? 0) || (x.no ?? 0) - (y.no ?? 0));
    return {
      rows: [hub, ...appRows],
      unknown: extra,
      appsWithUsers: appRows.filter((r) => (r.s?.visitors ?? 0) > 0).length,
      appCount: appRows.length,
    };
  }, [catalog, stats, sort]);

  const max = Math.max(1, ...rows.filter((r) => r.key !== "_hub").map((r) => r.s?.visitors ?? 0));
  const periodLabel = PERIODS.find(([v]) => v === days)?.[1] ?? `${days} ngày`;
  const prevLabel = stats?.prev_since ? `${stats.prev_since} → ${stats.prev_until}` : "";

  const downloadCsv = () => {
    const head = ["so_thu_tu", "phan_mem", "ten_mien", "nguoi_truy_cap", "ky_truoc", "tang_truong_pct", "luot_truy_cap",
      "nguoi_moi", "quay_lai", "qua_hub", "tu_app_khac", "tim_kiem", "mang_xa_hoi", "vao_thang", "trang_khac", "lan_cuoi"];
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const lines = [head.join(",")];
    [...rows, ...unknown].forEach((r) => {
      const s = r.s;
      const g = r.growth === null ? "" : r.growth === Infinity ? "moi" : Math.round(r.growth);
      lines.push([r.no ?? "", q(r.name), r.host, s?.visitors ?? 0, s?.prev_visitors ?? "", g, s?.visits ?? 0,
        s?.new_visitors ?? 0, s?.returning_visitors ?? 0,
        ...SOURCES.map((x) => s?.sources[x.key] ?? 0), s?.last ?? ""].join(","));
    });
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `truy-cap-app-${days || "tat-ca"}-ngay-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const num = "px-3 py-2 text-right font-mono tabular-nums";
  const t = stats?.totals;
  const tiles: Array<[string, string, string]> = [
    ["Người truy cập", t ? fmt(t.visitors) : "—", "trình duyệt khác nhau, tính chung mọi app"],
    ["Lượt truy cập", t ? fmt(t.visits) : "—", "1 lượt = 1 lần mở app (cách nhau ≥ 30 phút)"],
    ["Người mới", t ? fmt(t.new_visitors) : "—", "lần đầu vào bất kỳ app nào"],
    ["Dùng từ 2 app", t ? fmt(t.multi_app_visitors) : "—", "gợi ý cho gói nhiều app"],
    ["App có người dùng", stats ? `${appsWithUsers}/${appCount}` : "—", periodLabel],
  ];

  return (
    <Panel title="Truy cập từng app" actions={<>
      <select aria-label="Khoảng thời gian" className={`${inputCls} w-32`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
        {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select aria-label="Sắp xếp" className={`${inputCls} w-44`} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
        {SORTS.map(([v, l]) => <option key={v} value={v}>Xếp theo: {l}</option>)}
      </select>
      <button className={btn.ghost} onClick={load} disabled={busy}>{busy ? "Đang tải…" : "Tải lại"}</button>
      <button className={btn.primary} onClick={downloadCsv} disabled={!stats}>Tải CSV (Excel)</button></>}>
      {err && <Notice kind="error">{err}</Notice>}

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map(([label, value, hint]) => (
          <div key={label} className="rounded-lg border border-line px-4 py-3">
            <dt className="text-xs uppercase tracking-wider text-mute">{label}</dt>
            <dd className="mt-1 font-mono text-2xl text-ink">{value}</dd>
            <dd className="mt-0.5 text-[11px] leading-snug text-mute">{hint}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg bg-paper px-4 py-3 text-sm">
        <label className="flex items-center gap-2 text-ink">
          Ngưỡng xem xét thu phí
          <input type="number" min={1} step={10} value={threshold}
            onChange={(e) => setThreshold(Math.max(1, Number(e.target.value) || 1))}
            className={`${inputCls} w-24 text-right font-mono`} />
          <span className="text-mute">người / {periodLabel}</span>
        </label>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
          Nguồn đến:
          {SOURCES.map((x) => (
            <span key={x.key} className="inline-flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-sm ${x.cls}`} />{x.label}</span>
          ))}
        </span>
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Phần mềm</th>
              <th className="w-56 px-3 py-2 font-medium">Người truy cập</th>
              <th className="px-3 py-2 text-right font-medium" title={prevLabel ? `So với ${prevLabel}` : ""}>So kỳ trước</th>
              <th className="px-3 py-2 text-right font-medium">Lượt</th>
              <th className="px-3 py-2 text-right font-medium" title="Người vào app từ 2 ngày khác nhau trở lên">Quay lại</th>
              <th className="px-3 py-2 font-medium">Nguồn đến</th>
              <th className="px-3 py-2 font-medium">Xu hướng / ngày</th>
              <th className="px-5 py-2 font-medium">Lần cuối</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = r.s;
              const isHub = r.key === "_hub";
              const hot = !isHub && (s?.visitors ?? 0) >= threshold;
              return (
                <tr key={r.key} className={`border-b border-line/70 ${isHub ? "bg-paper/60" : ""} ${hot ? "bg-signal-100/40" : ""}`}>
                  <td className="px-5 py-2 font-mono text-xs text-mute">{isHub ? "HUB" : `${r.code}·${String(r.no ?? 0).padStart(2, "0")}`}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 text-ink">
                      {r.name}
                      {hot && <span className="rounded bg-signal px-1.5 py-0.5 text-[10.5px] font-semibold text-white">≥ ngưỡng</span>}
                    </span>
                    <a href={`https://${r.host}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-mute hover:text-sonar">{r.host}</a>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right font-mono font-medium tabular-nums text-ink">{s ? fmt(s.visitors) : "—"}</span>
                      {!isHub && (
                        <span className="h-2 flex-1 rounded-full bg-paper">
                          <span className="block h-2 rounded-full bg-sonar" style={{ width: `${((s?.visitors ?? 0) / max) * 100}%` }} />
                        </span>
                      )}
                    </div>
                    {s && s.new_visitors > 0 && <span className="ml-14 text-[11px] text-mute">{fmt(s.new_visitors)} người mới</span>}
                  </td>
                  <td className="px-3 py-2 text-right"><Growth g={r.growth} /></td>
                  <td className={num}>{s ? fmt(s.visits) : "—"}</td>
                  <td className={num}>{s ? fmt(s.returning_visitors) : "—"}</td>
                  <td className="px-3 py-2">{s ? <SourceBar s={s} /> : <span className="text-xs text-mute">—</span>}</td>
                  <td className="px-3 py-2"><Sparkline values={r.series} /></td>
                  <td className="px-5 py-2 whitespace-nowrap font-mono text-xs text-mute">
                    {s?.last ? s.last.slice(5, 16).replace("T", " ") : <span title="Chưa có số liệu: app chưa gắn ose-track.js hoặc chưa có ai vào">chưa có</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {unknown.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-ink">Tên miền khác</h2>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {unknown.map((r) => (
                <li key={r.key} className="flex justify-between gap-3 px-4 py-2">
                  <span className="truncate font-mono text-xs">{r.host}</span>
                  <span className="font-mono tabular-nums">{fmt(r.s?.visitors ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(stats?.countries?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-ink">Quốc gia</h2>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {stats!.countries.map((c) => (
                <li key={c.country} className="flex justify-between gap-3 px-4 py-2">
                  <span className="font-mono text-xs">{c.country}</span>
                  <span className="font-mono tabular-nums">{fmt(c.visitors)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(stats?.other_refs?.length ?? 0) > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-ink">Trang khác giới thiệu</h2>
            <ul className="divide-y divide-line rounded-lg border border-line text-sm">
              {stats!.other_refs.map((o) => (
                <li key={o.ref} className="flex justify-between gap-3 px-4 py-2">
                  <span className="truncate font-mono text-xs">{o.ref}</span>
                  <span className="font-mono tabular-nums">{fmt(o.visits)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-mute">
        Đếm khi app được mở, kể cả khi người dùng vào thẳng tên miền của app mà không qua trang chủ. Mỗi app cần gắn 1 dòng
        <code className="mx-1 rounded bg-paper px-1 font-mono">&lt;script src="https://portlogistics.ose.vn/ose-track.js" defer&gt;&lt;/script&gt;</code>
        trong &lt;head&gt;; app ghi "chưa có" có thể chưa gắn dòng này. "Người" là số trình duyệt khác nhau: một người dùng cả máy tính và điện thoại
        được tính 2; trình duyệt chặn cookie hoặc Safari xoá sau 7 ngày có thể làm số người hơi cao hơn thực tế. Không lưu IP hay thông tin cá nhân.
        {stats?.first_day && <> Số liệu có từ ngày {stats.first_day}.</>}
      </p>
    </Panel>
  );
}
