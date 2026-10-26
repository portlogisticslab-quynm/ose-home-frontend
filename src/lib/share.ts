export const SITE_URL: string = (import.meta.env.VITE_SITE_URL || "https://ose.vn").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return SITE_URL + (path.startsWith("/") ? path : "/" + path);
}

/** Adds UTM tags so visits from each network show up separately in analytics. */
export function withUtm(url: string, source: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=${source}&utm_medium=social&utm_campaign=hub`;
}

export function facebookShare(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm(url, "facebook"))}`;
}

export function linkedinShare(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(withUtm(url, "linkedin"))}`;
}

export function xShare(url: string, text: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(withUtm(url, "x"))}&text=${encodeURIComponent(text)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
