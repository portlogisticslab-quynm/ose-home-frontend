# OSE — Open Solutions for Engineering · frontend (ose.vn)

React 18 + Vite 5 + Tailwind 3, prerender toàn bộ trang (SEO, chia sẻ Facebook/Zalo).

- `/`, `/en/` trang chủ · `/apps/<slug>/` trang từng phần mềm
- `/bai-viet/`, `/bai-viet/<slug>/` (VI) · `/en/articles/`, `/en/articles/<slug>/` (EN, chỉ bài đã dịch)
- `/rss.xml`, `/en/rss.xml`, `/sitemap.xml` · `/admin/` quản trị

## Build (Cloudflare Pages)

Build command `npm run build`, output `dist`, biến `NODE_VERSION=20`. Bước đầu `scripts/fetch-content.mjs` lấy nội dung mới nhất:

1. `https://api-osevn.ose.vn/api/v1/site-content` (backend)
2. nếu backend tắt: `https://ose.vn/content/site-content.json` (bản chụp của lần build trước)
3. nếu cả hai lỗi: giữ `src/data/*.json` trong repo

Ảnh bài viết (`/media/…`) được tải về `public/media/` nên trang công khai không phụ thuộc backend.
Backend gọi Deploy hook của Pages sau mỗi lần sửa nội dung trong Admin → trang tự cập nhật sau 2–3 phút.

Markdown của bài viết do `src/lib/markdown.ts` hiển thị (không thư viện ngoài, luôn escape HTML).
