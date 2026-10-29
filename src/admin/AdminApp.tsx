import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../lib/api";
import { Logo, IconShield } from "../components/Icons";
import { SITE_URL } from "../lib/share";
import { ENTITIES } from "./entities";
import EntityPanel from "./EntityPanel";
import UsersPanel from "./UsersPanel";
import AuditPanel from "./AuditPanel";
import DataPanel from "./DataPanel";
import PromotePanel from "./PromotePanel";
import RegistrationsPanel from "./RegistrationsPanel";
import StatsPanel from "./StatsPanel";
import VisitsPanel from "./VisitsPanel";
import ArticlesPanel from "./ArticlesPanel";
import PublishBar from "./PublishBar";

export interface Session { token: string; username: string; role: "admin" | "editor" | "member" }

const KEY = "hub-admin-session";
function loadSession(): Session | null {
  try { const raw = sessionStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveSession(s: Session | null) {
  try { s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY); } catch { /* storage blocked: keep in memory */ }
}

function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await apiFetch<{ access_token: string; username: string; role: Session["role"] }>(
        "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      if (r.role === "member") { setErr("Tài khoản thành viên không có quyền quản trị."); return; }
      onLogin({ token: r.access_token, username: r.username, role: r.role });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Không kết nối được máy chủ.");
    } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3"><Logo size={36} /><div>
          <p className="font-semibold text-ink">Admin — OSE</p>
          <p className="font-mono text-xs text-mute">{SITE_URL.replace(/^https?:\/\//, "")}</p></div></div>
        <label className="block text-sm font-medium text-ink">Tên đăng nhập
          <input autoComplete="username" required value={username} onChange={(e) => setU(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sonar" /></label>
        <label className="mt-4 block text-sm font-medium text-ink">Mật khẩu
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setP(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sonar" /></label>
        {err && <p className="mt-4 rounded-md bg-signal-100 px-3 py-2 text-sm text-signal-600" role="alert">{err}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-ink py-2.5 font-semibold text-white hover:bg-ink-700 disabled:opacity-60">
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
        <a href="/" className="mt-4 block text-center text-sm text-mute hover:text-ink">← Về trang chủ</a>
      </form>
    </div>
  );
}

type Tab = string;

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [tab, setTab] = useState<Tab>("articles");

  const logout = useCallback(() => { saveSession(null); setSession(null); }, []);
  const login = (s: Session) => { saveSession(s); setSession(s); };

  // Validate the stored token once (expired → back to login).
  useEffect(() => {
    if (!session) return;
    apiFetch("/api/v1/auth/me", { token: session.token }).catch((e) => { if (e instanceof ApiError && e.status === 401) logout(); });
  }, [session, logout]);

  if (!session) return <Login onLogin={login} />;

  const tabs: Array<[Tab, string]> = [
    ["articles", "Bài viết"],
    ...ENTITIES.map((e) => [e.key, e.label] as [Tab, string]),
    ["registrations", "Đăng ký khoá học"],
    ["visits", "Truy cập app"],
    ["stats", "Lượt bấm trên ose.vn"],
    ["promote", "Quảng bá"],
    ...(session.role === "admin"
      ? ([["users", "Người dùng & quyền"], ["audit", "Nhật ký"], ["data", "Sao lưu & nhập danh mục"]] as Array<[Tab, string]>) : []),
  ];
  const onAuthError = (e: unknown) => { if (e instanceof ApiError && e.status === 401) logout(); };
  const def = ENTITIES.find((e) => e.key === tab);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5"><Logo size={30} /><span className="font-semibold">Admin — OSE</span></a>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-1.5 text-white/70 sm:flex"><IconShield size={16} />{session.username} · {session.role}</span>
            <button onClick={logout} className="rounded-md border border-white/20 px-3 py-1.5 hover:border-white/50">Đăng xuất</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-page gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Admin">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${tab === k ? "border-signal text-white" : "border-transparent text-white/60 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-page px-4 py-8 sm:px-6">
        <PublishBar session={session} onAuthError={onAuthError} />
        {def && <EntityPanel key={def.key} def={def} session={session} onAuthError={onAuthError} />}
        {tab === "registrations" && <RegistrationsPanel session={session} onAuthError={onAuthError} />}
        {tab === "articles" && <ArticlesPanel session={session} onAuthError={onAuthError} />}
        {tab === "visits" && <VisitsPanel session={session} onAuthError={onAuthError} />}
        {tab === "stats" && <StatsPanel session={session} onAuthError={onAuthError} />}
        {tab === "promote" && <PromotePanel />}
        {tab === "users" && <UsersPanel session={session} onAuthError={onAuthError} />}
        {tab === "audit" && <AuditPanel session={session} onAuthError={onAuthError} />}
        {tab === "data" && <DataPanel session={session} onAuthError={onAuthError} />}
      </main>
    </div>
  );
}
