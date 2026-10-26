import { describe, expect, it } from "vitest";
import { readingMinutes, renderMarkdown, slugify } from "./markdown";

describe("renderMarkdown", () => {
  it("escapes raw HTML and drops unsafe links", () => {
    const { html } = renderMarkdown("<script>alert(1)</script> [x](javascript:alert(1)) ![y](data:image/png;base64,AA)");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
    expect(html).not.toContain('src="data:');
  });

  it("renders headings with ids, lists, tables and figures", () => {
    const r = renderMarkdown("## Bảng số liệu\n\n- a\n- b\n\n1. c\n\n| A | B |\n|---|--:|\n| 1 | 2 |\n\n![Ảnh](/media/a-1.jpg)", { mediaBase: "https://api/x" });
    expect(r.headings).toEqual([{ level: 2, id: "bang-so-lieu", text: "Bảng số liệu" }]);
    expect(r.html).toContain("<ul><li>a</li><li>b</li></ul>");
    expect(r.html).toContain("<ol><li>c</li></ol>");
    expect(r.html).toContain('<td style="text-align:right">2</td>');
    expect(r.html).toContain('<img src="https://api/x/media/a-1.jpg" alt="Ảnh"');
    expect(r.html).toContain("<figcaption>Ảnh</figcaption>");
  });

  it("embeds a YouTube link alone on a line", () => {
    expect(renderMarkdown("https://youtu.be/dQw4w9WgXcQ").html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("slugifies Vietnamese and estimates reading time", () => {
    expect(slugify("Kỹ thuật cảng Đà Nẵng!")).toBe("ky-thuat-cang-da-nang");
    expect(readingMinutes("từ ".repeat(450))).toBe(2);
  });
});
