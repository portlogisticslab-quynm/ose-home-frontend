import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import type { Session } from "./AdminApp";
import { Modal, Notice, Panel, btn, inputCls } from "./ui";

interface UserRow { id: number; username: string; role: string; active: boolean; created_at: string; last_login: string | null }
const ROLES: Array<[string, string]> = [["admin", "Admin — toàn quyền"], ["editor", "Editor — sửa nội dung"], ["member", "Member — thành viên (tương lai)"]];

export default function UsersPanel({ session, onAuthError }: { session: Session; onAuthError: (e: unknown) => void }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState<{ username: string; password: string; role: string } | null>(null);
  const call = useCallback(<T,>(p: string, i: RequestInit = {}) => apiFetch<T>(p, { ...i, token: session.token }), [session.token]);

  const load = useCallback(async () => {
    try { setRows(await call<UserRow[]>("/api/v1/admin/users")); setErr(""); }
    catch (e) { onAuthError(e); setErr(e instanceof Error ? e.message : String(e)); }
  }, [call, onAuthError]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); setOk(msg); setErr(""); await load(); }
    catch (e) { onAuthError(e); setErr(e instanceof ApiError ? e.message : String(e)); }
  };

  const create = () => form && act(async () => {
    await call("/api/v1/admin/users", { method: "POST", body: JSON.stringify({ ...form, active: true }) });
    setForm(null);
  }, `Đã tạo tài khoản ${form.username}`);

  const resetPw = (u: UserRow) => {
    const pw = window.prompt(`Mật khẩu mới cho ${u.username} (tối thiểu 10 ký tự):`);
    if (pw) act(() => call(`/api/v1/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ password: pw }) }), `Đã đổi mật khẩu ${u.username}`);
  };

  return (
    <Panel title="Người dùng & phân quyền" actions={<button className={btn.primary} onClick={() => setForm({ username: "", password: "", role: "editor" })}>+ Cấp tài khoản</button>}>
      <p className="mb-4 text-sm text-mute">
        Hiện tại mọi phần mềm đều truy cập miễn phí. Vai trò <b>member</b> và chế độ <code className="font-mono">ACCESS_MODE=restricted</code> đã sẵn sàng để bật khi cần giới hạn truy cập.
      </p>
      {err && <Notice kind="error">{err}</Notice>}
      {ok && <Notice kind="ok">{ok}</Notice>}
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
            <th className="px-5 py-2">Tài khoản</th><th className="px-3 py-2">Vai trò</th><th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2">Đăng nhập gần nhất</th><th className="px-5 py-2 text-right">Thao tác</th></tr></thead>
          <tbody>
            {rows.map((u) => {
              const self = u.username === session.username;
              return (
                <tr key={u.id} className="border-b border-line/70">
                  <td className="px-5 py-2.5 font-medium">{u.username}{self && <span className="ml-2 text-xs text-mute">(bạn)</span>}</td>
                  <td className="px-3 py-2">
                    <select className={`${inputCls} w-40 py-1.5`} value={u.role} disabled={self}
                      onChange={(e) => act(() => call(`/api/v1/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ role: e.target.value }) }), `Đã đổi vai trò ${u.username}`)}>
                      {ROLES.map(([v]) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button disabled={self} className={`${u.active ? btn.ghost : btn.danger} py-1.5`}
                      onClick={() => act(() => call(`/api/v1/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ active: !u.active }) }), `Đã cập nhật ${u.username}`)}>
                      {u.active ? "Đang hoạt động" : "Đã khoá"}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-mute">{u.last_login ? new Date(u.last_login).toLocaleString("vi-VN") : "—"}</td>
                  <td className="whitespace-nowrap px-5 py-2 text-right">
                    <button className={`${btn.ghost} mr-2 py-1.5`} onClick={() => resetPw(u)}>Đổi mật khẩu</button>
                    {!self && <button className={`${btn.danger} py-1.5`} onClick={() => window.confirm(`Xoá tài khoản ${u.username}?`) &&
                      act(() => call(`/api/v1/admin/users/${u.id}`, { method: "DELETE" }), `Đã xoá ${u.username}`)}>Xoá</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title="Cấp tài khoản mới" onClose={() => setForm(null)}>
          <div className="grid gap-4">
            <label className="text-sm font-medium">Tên đăng nhập<input className={`${inputCls} mt-1`} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            <label className="text-sm font-medium">Mật khẩu (≥ 10 ký tự)<input type="password" autoComplete="new-password" className={`${inputCls} mt-1`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="text-sm font-medium">Vai trò<select className={`${inputCls} mt-1`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          <div className="mt-6 flex justify-end gap-2"><button className={btn.ghost} onClick={() => setForm(null)}>Huỷ</button><button className={btn.primary} onClick={create}>Tạo</button></div>
        </Modal>
      )}
    </Panel>
  );
}
