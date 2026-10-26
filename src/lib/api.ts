/**
 * One API layer for the whole frontend.
 *
 * Bases are tried in order: VITE_API_BASE (default "" = same origin, Nginx proxies /api
 * to the backend) then VITE_API_FALLBACK (e.g. the Render backend URL). A base that
 * fails with a network error, timeout or 502/503/504 is skipped.
 */
const PRIMARY = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
const FALLBACK = (import.meta.env.VITE_API_FALLBACK ?? "").replace(/\/$/, "");
const BASES = [PRIMARY, ...(FALLBACK && FALLBACK !== PRIMARY ? [FALLBACK] : [])];
const RETRY_STATUS = new Set([502, 503, 504, 520, 521, 522, 523, 524, 530]);

/** Base URL of the backend (empty = same origin). Used for uploaded images in the admin preview. */
export function apiBase(): string {
  return PRIMARY;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
  }
}

function detailMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const loc = Array.isArray(d?.loc) ? d.loc.filter((x: unknown) => x !== "body").join(".") : "";
      return loc ? `${loc}: ${d?.msg}` : String(d?.msg ?? d);
    }).join("; ");
  }
  return "Lỗi không xác định / Unknown error";
}

export async function apiFetch<T>(path: string, init: RequestInit & { token?: string; timeoutMs?: number } = {}): Promise<T> {
  const { token, timeoutMs = 6000, headers, ...rest } = init;
  let lastErr: unknown = null;
  for (const base of BASES) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(base + path, {
        ...rest,
        signal: ctrl.signal,
        headers: {
          ...(rest.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(headers as Record<string, string> | undefined),
        },
      });
      clearTimeout(timer);
      if (RETRY_STATUS.has(res.status)) { lastErr = new ApiError(res.status, `HTTP ${res.status}`); continue; }
      if (res.status === 204) return undefined as T;
      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      const body = isJson ? await res.json() : await res.text();
      if (!res.ok) {
        const detail = isJson ? (body as { detail?: unknown }).detail : body;
        throw new ApiError(res.status, detailMessage(detail), detail);
      }
      return body as T;
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof ApiError) throw e;   // a real answer from the server: do not retry elsewhere
      lastErr = e;                           // network error / timeout: try the next base
    }
  }
  throw lastErr instanceof Error ? lastErr : new ApiError(0, "Không kết nối được máy chủ / Server unreachable");
}
