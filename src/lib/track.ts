/**
 * Click statistics (Admin › Thống kê). Fire-and-forget: never delays or blocks the link.
 * Uses navigator.sendBeacon with a text/plain body so cross-origin calls need no CORS preflight.
 * Nothing personal is sent: only what was clicked and the page language.
 */
import type { Lang } from "./types";

export type TrackKind = "app" | "guide" | "demo" | "course";

const BASES = [import.meta.env.VITE_API_BASE ?? "", import.meta.env.VITE_API_FALLBACK ?? ""]
  .map((b) => b.replace(/\/$/, ""));

/** Stable short key for items without a slug (course, loose guide/demo): same on fallback data and live API. */
export function urlKey(prefix: string, url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h * 33) ^ url.charCodeAt(i)) >>> 0;
  return `${prefix}:${h.toString(36)}`;
}

export function track(kind: TrackKind, target: string, label: string, lang: Lang): void {
  try {
    const body = JSON.stringify({ kind, target: target.toLowerCase().slice(0, 100), label: label.slice(0, 200), lang });
    const url = `${BASES[0]}/api/v1/track`;
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
    void fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(() => {});
  } catch {
    /* statistics must never break the page */
  }
}
