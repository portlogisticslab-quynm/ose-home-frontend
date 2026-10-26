/**
 * Small Markdown renderer for articles (no dependency, same output at build time and in the browser).
 *
 * Supported: # headings (h1–h4), paragraphs, **bold**, *italic*, ~~strike~~, `code`, ```code blocks```,
 * [links](https://…), ![images](/media/…), > quotes, - / 1. lists (one nested level), tables, ---,
 * and a YouTube link alone on a line (embedded player). Raw HTML is always escaped.
 */
import { youtubeId } from "./catalog";

export interface Heading { level: number; id: string; text: string }
export interface Rendered { html: string; headings: Heading[]; words: number }
export interface MdOptions {
  /** Prefix for /media/… images (admin preview uses the API: https://api…/api/v1). Default: "" (same site). */
  mediaBase?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "Kỹ thuật cảng 2026!" -> "ky-thuat-cang-2026" */
export function slugify(text: string): string {
  return text
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeUrl(url: string, opts: MdOptions): string | null {
  const u = url.trim();
  if (/^\/media\/[a-z0-9][a-z0-9-]*\.(jpg|png|webp|gif)$/.test(u)) return (opts.mediaBase ?? "") + u;
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^(\/(?!\/)|#)/.test(u)) return u;          // same-site path or anchor
  return null;                                     // javascript:, data:, //host … are dropped
}

function inline(src: string, opts: MdOptions): string {
  // 1. protect code spans
  const codes: string[] = [];
  let s = src.replace(/`([^`]+)`/g, (_m, c: string) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  // 2. images and links (before escaping, so the URL is read raw)
  const tokens: string[] = [];
  const keep = (h: string) => { tokens.push(h); return `\u0001${tokens.length - 1}\u0001`; };
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, alt: string, url: string, title?: string) => {
    const u = safeUrl(url, opts);
    if (!u) return esc(m);
    return keep(`<img src="${esc(u)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy" decoding="async" />`);
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, text: string, url: string, title?: string) => {
    const u = safeUrl(url, opts);
    if (!u) return esc(m);
    const ext = /^https?:/i.test(u);
    return keep(`<a href="${esc(u)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inlineText(text)}</a>`);
  });
  // bare https:// links
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g, (_m, pre: string, url: string) =>
    pre + keep(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`));
  // 3. escape the rest, then emphasis
  s = inlineText(s);
  s = s.replace(/\u0001(\d+)\u0001/g, (_m, i: string) => tokens[Number(i)]);
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codes[Number(i)]);
  return s;
}

function inlineText(s: string): string {
  return esc(s)
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/__(?=\S)([\s\S]*?\S)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_(?=\S)([^_]*?\S)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
    .replace(/ {2,}\n|\\\n/g, "<br />")
    .replace(/\n/g, " ");
}

const plain = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[`*_~]/g, "").trim();

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

export function renderMarkdown(md: string, opts: MdOptions = {}): Rendered {
  const lines = (md || "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  const headings: Heading[] = [];
  const ids = new Map<string, number>();
  let words = 0;
  let i = 0;

  const countWords = (t: string) => { words += plain(t).split(/\s+/).filter(Boolean).length; };
  const isBlank = (l: string) => /^\s*$/.test(l);
  const isFence = (l: string) => /^\s*```/.test(l);
  const isHeading = (l: string) => /^#{1,4}\s+\S/.test(l);
  const isHr = (l: string) => /^\s*([-*_])(\s*\1){2,}\s*$/.test(l);
  const isQuote = (l: string) => /^\s*>/.test(l);
  const listRe = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
  const isTableStart = (k: number) => /\|/.test(lines[k] ?? "") && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[k + 1] ?? "");
  const blockStart = (k: number) => isFence(lines[k]) || isHeading(lines[k]) || isHr(lines[k]) || isQuote(lines[k]) ||
    listRe.test(lines[k]) || isTableStart(k);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    if (isFence(line)) {
      const lang = line.trim().slice(3).trim().replace(/[^\w+-]/g, "");
      const buf: string[] = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ""}>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    if (isHeading(line)) {
      const m = line.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/)!;
      const level = Math.max(2, m[1].length);                 // "#" and "##" -> h2 (the page title is the h1)
      const text = plain(m[2]);
      let id = slugify(text) || "muc";
      const n = ids.get(id) ?? 0;
      ids.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;
      headings.push({ level, id, text });
      countWords(m[2]);
      out.push(`<h${level} id="${id}">${inline(m[2], opts)}</h${level}>`);
      i++;
      continue;
    }

    if (isHr(line)) { out.push("<hr />"); i++; continue; }

    if (isQuote(line)) {
      const buf: string[] = [];
      while (i < lines.length && isQuote(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      const inner = renderMarkdown(buf.join("\n"), opts);
      words += inner.words;
      out.push(`<blockquote>${inner.html}</blockquote>`);
      continue;
    }

    if (isTableStart(i)) {
      const head = splitRow(lines[i]);
      const align = splitRow(lines[i + 1]).map((c) => (c.endsWith(":") ? (c.startsWith(":") ? "center" : "right") : ""));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i]) && !isBlank(lines[i])) rows.push(splitRow(lines[i++]));
      const cell = (tag: string, c: string, k: number) => {
        countWords(c);
        return `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ""}>${inline(c, opts)}</${tag}>`;
      };
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => cell("th", c, k)).join("")}</tr></thead><tbody>${
        rows.map((r) => `<tr>${head.map((_h, k) => cell("td", r[k] ?? "", k)).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    if (listRe.test(line)) {
      const baseIndent = line.match(listRe)![1].length;
      const ordered = /\d/.test(line.match(listRe)![2]);
      const start = ordered ? parseInt(line.match(listRe)![2], 10) : 1;
      const items: { text: string[]; sub: string[] }[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const m = l.match(listRe);
        if (m && m[1].length <= baseIndent + 1) {
          if (/\d/.test(m[2]) !== ordered) break;          // "- a" then "1. b": two separate lists
          items.push({ text: [m[3]], sub: [] });
          i++;
        } else if (m && items.length) {
          items[items.length - 1].sub.push(l.slice(baseIndent + 2));
          i++;
        } else if (!isBlank(l) && items.length && /^\s{2,}\S/.test(l)) {
          const it = items[items.length - 1];
          (it.sub.length ? it.sub : it.text).push(l.trim());
          i++;
        } else if (!isBlank(l) && items.length && !blockStart(i)) {
          items[items.length - 1].text.push(l.trim());     // lazy continuation
          i++;
        } else if (isBlank(l) && listRe.test(lines[i + 1] ?? "") && lines[i + 1].match(listRe)![1].length <= baseIndent + 1 &&
                   /\d/.test(lines[i + 1].match(listRe)![2]) === ordered) {
          i++;                                              // blank line between items
        } else break;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}>${items.map((it) => {
        countWords(it.text.join(" "));
        const sub = it.sub.length ? renderMarkdown(it.sub.join("\n"), opts) : null;
        if (sub) words += sub.words;
        return `<li>${inline(it.text.join("\n"), opts)}${sub ? sub.html : ""}</li>`;
      }).join("")}</${tag}>`);
      continue;
    }

    // YouTube link alone on a line -> embedded player
    const yt = line.trim().match(/^https?:\/\/\S+$/) ? youtubeId(line.trim()) : null;
    if (yt) {
      out.push(`<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="YouTube video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`);
      i++;
      continue;
    }

    // paragraph (an image alone becomes a figure with its alt text as caption)
    const buf: string[] = [];
    while (i < lines.length && !isBlank(lines[i]) && !(buf.length && blockStart(i))) buf.push(lines[i++]);
    const text = buf.join("\n");
    const img = text.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
    countWords(text);
    if (img && img[1]) out.push(`<figure>${inline(text.trim(), opts)}<figcaption>${esc(img[1])}</figcaption></figure>`);
    else out.push(`<p>${inline(text, opts)}</p>`);
  }
  return { html: out.join("\n"), headings, words };
}

/** Reading time in minutes (≈ 200 words per minute, at least 1). */
export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(renderMarkdown(md).words / 200));
}
