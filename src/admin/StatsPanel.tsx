import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { appNumbers, seedToCatalog } from "../lib/catalog";
import type { Catalog, Seed } from "../lib/types";
import seed from "../data/catalog.fallback.json";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn, inputCls } from "./ui";

interface Item { kind: "app" | "guide" | "demo" | "course"; target: string; label: string; count: number; total: number; last: string | null }
interface Stats { days: number; totals: Record<string, number>; items: Item[] }

const PERIODS: Array<[number, string]> = [[7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"], [365, "12 tháng"], [0, "Từ đầu"]];
const KIND_LABEL: Record<string, string> = { app: "Mở app", guide: "Hướng dẫn", demo: "Demo", course: "Khoá học" };

interface AppRow { slug: string; no: number; code: string; name: string; app: number; guide: number; demo: number; sum: number }

/** Click counts per app / guide / demo / course. Data comes from /api/v1/track beacons; no personal data. */
export default function StatsPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [catalog, setCatalog] = useState<Catalog>(() => seedToCatalog(seed as Seed));
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setStats(await apiFetch<Stats>(`/api/v1/admin/stats/clicks?days=${days}`, { token: session.token }));
      setErr("");
    } catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  }, [days, session.token, onAuthError]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiFetch<Catalog>("/api/v1/catalog").then((c) => c?.groups?.length && setCatalog(c)).catch(() => {}); }, []);

  const { apps, others } = useMemo(() => {
    const nums = appNumbers(catalog);
    const byKey = new Map<string, Item>();
    (stats?.items ?? []).forEach((i) => byKey.set(`${i.kind}|${i.target}`, i));
    const known = new Set<string>();
    const rows: AppRow[] = catalog.groups.flatMap((g) => g.apps.map((a) => {
      const c = (k: string) => { known.add(`${k}|${a.slug}`); return byKey.get(`${k}|${a.slug}`)?.count ?? 0; };
      const r = { slug: a.slug, no: nums[a.slug], code: g.code, name: a.name, app: c("app"), guide: c("guide"), demo: c("demo"), sum: 0 };
      r.sum = r.app + r.guide + r.demo;
      return r;
    }));
    rows.sort((x, y) => y.sum - x.sum || x.no - y.no);
    const rest = (stats?.items ?? []).filter((i) => !known.has(`${i.kind}|${i.target}`) && i.count > 0);
    return { apps: rows, others: rest };
  }, [catalog, stats]);

  const max = Math.max(1, ...apps.map((a) => a.sum));

  const downloadCsv = () => {
    const lines = [["so_thu_tu", "phan_mem", "mo_app", "huong_dan", "demo", "tong"].join(",")];
    apps.forEach((a) => lines.push([a.no, `"${a.name.replace(/"/g, '""')}"`, a.app, a.guide, a.demo, a.sum].join(",")));
    others.forEach((o) => lines.push(["", `"${(o.label || o.target).replace(/"/g, '""')} (${KIND_LABEL[o.kind]})"`, "", "", "", o.count].join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `thong-ke-luot-bam-${days || "tat-ca"}-ngay-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const num = "px-3 py-2 text-right font-mono tabular-nums";
  return (
    <Panel title="Thống kê lượt bấm" actions={<>
      <select className={`${inputCls} w-36`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
        {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <button className={btn.ghost} onClick={load}>Tải lại</button>
      <button className={btn.primary} onClick={downloadCsv} disabled={!stats}>Tải CSV (Excel)</button></>}>
      {err && <Notice kind="error">{err}</Notice>}

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["app", "guide", "demo", "course"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-line px-4 py-3">
            <dt className="text-xs uppercase tracking-wider text-mute">{KIND_LABEL[k]}</dt>
            <dd className="mt-1 font-mono text-2xl text-ink">{stats?.totals?.[k] ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Phần mềm</th>
              <th className="px-3 py-2 text-right font-medium">Mở app</th>
              <th className="px-3 py-2 text-right font-medium">Hướng dẫn</th>
              <th className="px-3 py-2 text-right font-medium">Demo</th>
              <th className="w-64 px-5 py-2 font-medium">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.slug} className="border-b border-line/70">
                <td className="px-5 py-2 font-mono text-xs text-mute">{a.code}·{String(a.no).padStart(2, "0")}</td>
                <td className="px-3 py-2 text-ink">{a.name}</td>
                <td className={num}>{a.app}</td>
                <td className={num}>{a.guide}</td>
                <td className={num}>{a.demo}</td>
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-right font-mono tabular-nums font-medium text-ink">{a.sum}</span>
                    <span className="h-2 flex-1 rounded-full bg-paper">
                      <span className="block h-2 rounded-full bg-sonar" style={{ width: `${(a.sum / max) * 100}%` }} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {others.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 font-semibold text-ink">Khoá học và mục khác</h2>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {others.map((o) => (
              <li key={`${o.kind}|${o.target}`} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 truncate"><span className="mr-2 rounded bg-paper px-1.5 py-0.5 font-mono text-[11px] text-mute">{KIND_LABEL[o.kind]}</span>{o.label || o.target}</span>
                <span className="font-mono tabular-nums font-medium text-ink">{o.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-xs text-mute">
        Đếm mỗi lần khách bấm nút Mở app, Hướng dẫn, Demo (kể cả bấm phát video) và Mở bài giảng. Không lưu địa chỉ IP hay thông tin cá nhân.
        Số liệu bắt đầu từ khi bản v1.4.0 được đưa lên.
      </p>
    </Panel>
  );
}
