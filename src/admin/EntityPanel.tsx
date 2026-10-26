import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import type { Session } from "./AdminApp";
import { type EntityDef, type Field, emptyRow } from "./entities";
import { Modal, Notice, Panel, btn, inputCls } from "./ui";

type Row = Record<string, unknown> & { id?: number };
interface Props { def: EntityDef; session: Session; onAuthError: (e: unknown) => void }

export default function EntityPanel({ def, session, onAuthError }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [refs, setRefs] = useState<{ groups: Row[]; apps: Row[] }>({ groups: [], apps: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [original, setOriginal] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const needs = useMemo(() => new Set(def.fields.filter((f) => f.ref).map((f) => f.ref!)), [def]);
  const call = useCallback(<T,>(path: string, init: RequestInit = {}) => apiFetch<T>(path, { ...init, token: session.token }), [session.token]);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [main, groups, apps] = await Promise.all([
        call<Row[]>(`/api/v1/admin/${def.key}`),
        needs.has("groups") ? call<Row[]>("/api/v1/admin/groups") : Promise.resolve([]),
        needs.has("apps") ? call<Row[]>("/api/v1/admin/apps") : Promise.resolve([]),
      ]);
      setRows(main); setRefs({ groups, apps });
    } catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [call, def.key, needs, onAuthError]);

  useEffect(() => { load(); }, [load]);

  const refLabel = (f: Field, v: unknown) => {
    if (v == null) return "—";
    const list = f.ref === "groups" ? refs.groups : refs.apps;
    const r = list.find((x) => x.id === v);
    return r ? String(f.ref === "groups" ? `${r.code} ${r.name_vi}` : r.name) : `#${v}`;
  };

  const shown = rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const cols = def.fields.filter((f) => f.list);

  const openNew = () => { setEditing(emptyRow(def)); setOriginal(null); setFormErr(""); };
  const openEdit = (r: Row) => { setEditing({ ...r }); setOriginal(r); setFormErr(""); };

  const save = async () => {
    if (!editing) return;
    for (const f of def.fields) {
      const v = editing[f.key];
      if (f.required && (v === "" || v == null)) { setFormErr(`"${f.label}" là bắt buộc`); return; }
    }
    const payload: Row = {};
    for (const f of def.fields) {
      const v = editing[f.key];
      if (!original || JSON.stringify(original[f.key]) !== JSON.stringify(v)) payload[f.key] = v;
    }
    setSaving(true); setFormErr("");
    try {
      if (original?.id != null) {
        if (Object.keys(payload).length) await call(`/api/v1/admin/${def.key}/${original.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        setOk(`Đã lưu: ${def.title(editing)}`);
      } else {
        await call(`/api/v1/admin/${def.key}`, { method: "POST", body: JSON.stringify(payload) });
        setOk(`Đã thêm: ${def.title(editing)}`);
      }
      setEditing(null);
      await load();
    } catch (e) {
      onAuthError(e);
      setFormErr(e instanceof ApiError ? e.message : "Lỗi kết nối");
    } finally { setSaving(false); }
  };

  const remove = async (r: Row) => {
    if (!window.confirm(`Xoá "${def.title(r)}"?\nThao tác được ghi vào nhật ký nhưng không tự hoàn tác.`)) return;
    try {
      await call(`/api/v1/admin/${def.key}/${r.id}`, { method: "DELETE" });
      setOk(`Đã xoá: ${def.title(r)}`);
      await load();
    } catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  };

  const set = (k: string, v: unknown) => setEditing((cur) => (cur ? { ...cur, [k]: v } : cur));

  const renderInput = (f: Field) => {
    const v = editing![f.key];
    switch (f.type) {
      case "textarea":
        return <textarea rows={3} className={inputCls} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} maxLength={600} />;
      case "number":
        return <input type="number" className={inputCls} value={Number(v ?? 0)} onChange={(e) => set(f.key, Number(e.target.value))} />;
      case "checkbox":
        return <input type="checkbox" className="h-5 w-5 accent-ink" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} />;
      case "select":
        return <select className={inputCls} value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}>
          {f.options!.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}</select>;
      case "ref": {
        const list = f.ref === "groups" ? refs.groups : refs.apps;
        return <select className={inputCls} value={v == null ? "" : String(v)} onChange={(e) => set(f.key, e.target.value === "" ? null : Number(e.target.value))}>
          {(f.nullable || v == null) && <option value="">{f.nullable ? "— Không gắn —" : "— Chọn —"}</option>}
          {list.map((r) => <option key={String(r.id)} value={String(r.id)}>{refLabel(f, r.id)}</option>)}</select>;
      }
      default:
        return <input type={f.type === "url" ? "url" : "text"} className={`${inputCls} ${f.type === "url" ? "font-mono text-xs" : ""}`}
          value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} placeholder={f.type === "url" ? "https://" : ""} />;
    }
  };

  return (
    <Panel title={`${def.label} (${rows.length})`} actions={<>
      <input type="search" placeholder="Lọc…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} w-44`} />
      <button className={btn.ghost} onClick={load}>Tải lại</button>
      <button className={btn.primary} onClick={openNew}>+ Thêm mới</button></>}>
      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="ok">{ok}</Notice>}
      {loading ? <p className="text-sm text-mute">Đang tải…</p> : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-2 font-medium">#</th>
              {cols.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
              <th className="px-5 py-2 text-right font-medium">Thao tác</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={String(r.id)} className="border-b border-line/70 align-top hover:bg-paper/60">
                  <td className="px-5 py-2.5 font-mono text-xs text-mute">{String(r.id)}</td>
                  {cols.map((c) => (
                    <td key={c.key} className={`max-w-xs px-3 py-2.5 ${c.type === "url" ? "break-all font-mono text-xs text-sonar" : ""}`}>
                      {c.type === "checkbox" ? (r[c.key] ? "✓" : "—")
                        : c.type === "ref" ? refLabel(c, r[c.key])
                        : c.type === "url" ? <a href={String(r[c.key])} target="_blank" rel="noopener noreferrer" className="hover:underline">{String(r[c.key])}</a>
                        : String(r[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-5 py-2 text-right">
                    <button className={`${btn.ghost} mr-2 py-1.5`} onClick={() => openEdit(r)}>Sửa</button>
                    <button className={`${btn.danger} py-1.5`} onClick={() => remove(r)}>Xoá</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={cols.length + 2} className="px-5 py-8 text-center text-mute">Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={original ? `Sửa — ${def.title(original)}` : `Thêm ${def.label.toLowerCase()}`} onClose={() => setEditing(null)}>
          {formErr && <Notice kind="error">{formErr}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            {def.fields.map((f) => (
              <label key={f.key} className={`block text-sm ${f.wide || f.type === "textarea" ? "sm:col-span-2" : ""} ${f.type === "checkbox" ? "flex items-center gap-3" : ""}`}>
                <span className="mb-1 block font-medium text-ink">{f.label}{f.required && <span className="text-signal"> *</span>}</span>
                {renderInput(f)}
                {f.help && <span className="mt-1 block text-xs text-mute">{f.help}</span>}
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
            <button className={btn.ghost} onClick={() => setEditing(null)}>Huỷ</button>
            <button className={btn.primary} disabled={saving} onClick={save}>{saving ? "Đang lưu…" : "Lưu"}</button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
