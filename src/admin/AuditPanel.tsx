import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import type { Session } from "./AdminApp";
import { Notice, Panel, btn, inputCls } from "./ui";

interface Entry { id: number; created_at: string; username: string; action: string; entity: string; entity_id: number | null; before: string | null; after: string | null; ip: string | null }

function diff(before: string | null, after: string | null): string {
  try {
    const b = before ? JSON.parse(before) : {};
    const a = after ? JSON.parse(after) : {};
    if (!before) return Object.entries(a).filter(([k]) => k !== "updated_at").map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ").slice(0, 300);
    if (!after) return `đã xoá: ${b.name ?? b.title ?? b.title_vi ?? b.username ?? ""}`;
    return Object.keys(a).filter((k) => k !== "updated_at" && JSON.stringify(a[k]) !== JSON.stringify(b[k]))
      .map((k) => `${k}: ${JSON.stringify(b[k])} → ${JSON.stringify(a[k])}`).join("; ").slice(0, 400);
  } catch { return ""; }
}

const COLOR: Record<string, string> = { create: "bg-sonar-100 text-ink", update: "bg-paper text-ink", delete: "bg-signal-100 text-signal-600", import: "bg-ink text-white", login: "bg-white text-mute border border-line", seed: "bg-paper text-mute" };

export default function AuditPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [rows, setRows] = useState<Entry[]>([]);
  const [entity, setEntity] = useState("");
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    try { setRows(await apiFetch<Entry[]>(`/api/v1/admin/audit?limit=300${entity ? `&entity=${entity}` : ""}`, { token: session.token })); setErr(""); }
    catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  }, [entity, session.token, onAuthError]);
  useEffect(() => { load(); }, [load]);

  return (
    <Panel title="Nhật ký thay đổi (audit log)" actions={<>
      <select className={`${inputCls} w-44`} value={entity} onChange={(e) => setEntity(e.target.value)}>
        <option value="">Tất cả</option>
        {["apps", "guides", "demos", "courses", "groups", "links", "registrations", "user", "catalog"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <button className={btn.ghost} onClick={load}>Tải lại</button></>}>
      {err && <Notice kind="error">{err}</Notice>}
      <ol className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[10rem_6rem_1fr]">
            <span className="font-mono text-xs text-mute">{new Date(r.created_at).toLocaleString("vi-VN")}</span>
            <span><span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${COLOR[r.action] ?? ""}`}>{r.action}</span></span>
            <span className="min-w-0 break-words">
              <b>{r.username}</b> · {r.entity}{r.entity_id != null && ` #${r.entity_id}`}
              <span className="block font-mono text-xs text-mute">{diff(r.before, r.after)}</span>
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-center text-mute">Chưa có bản ghi</li>}
      </ol>
    </Panel>
  );
}
