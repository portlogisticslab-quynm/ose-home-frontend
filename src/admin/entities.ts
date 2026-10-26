/** Field definitions for every editable entity in the admin panel. Mirrors backend/app/schemas.py. */
export type FieldType = "text" | "textarea" | "url" | "number" | "checkbox" | "select" | "ref";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Array<[string, string]>;
  ref?: "groups" | "apps";      // for type "ref": pick a row of another entity
  nullable?: boolean;           // ref may be empty
  help?: string;
  wide?: boolean;               // full row in the form grid
  list?: boolean;               // show as a table column
}

export interface EntityDef {
  key: "groups" | "apps" | "guides" | "demos" | "courses" | "links" | "categories";
  label: string;
  title: (row: Record<string, unknown>) => string;
  fields: Field[];
}

const common: Field[] = [
  { key: "sort_order", label: "Thứ tự", type: "number", help: "Số nhỏ hiển thị trước" },
  { key: "visible", label: "Hiển thị", type: "checkbox", list: true },
];

export const ENTITIES: EntityDef[] = [
  {
    key: "categories", label: "Chuyên mục", title: (r) => String(r.name_vi),
    fields: [
      { key: "name_vi", label: "Tên chuyên mục (VI)", type: "text", required: true, list: true },
      { key: "name_en", label: "Tên chuyên mục (EN)", type: "text", required: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true, list: true, help: "a-z, 0-9, '-' — dùng trong link lọc /bai-viet/?cm=<slug>" },
      { key: "desc_vi", label: "Mô tả (VI)", type: "textarea", wide: true },
      { key: "desc_en", label: "Mô tả (EN)", type: "textarea", wide: true },
      ...common,
    ],
  },
  {
    key: "apps", label: "Phần mềm", title: (r) => String(r.name),
    fields: [
      { key: "name", label: "Tên phần mềm", type: "text", required: true, wide: true, list: true },
      { key: "slug", label: "Slug", type: "text", required: true, help: "a-z, 0-9, '-' — dùng cho link chia sẻ /apps/<slug>/" },
      { key: "group_id", label: "Nhóm", type: "ref", ref: "groups", required: true, list: true },
      { key: "url", label: "Link app", type: "url", required: true, wide: true, list: true, help: "Chỉ chấp nhận https://*.ose.vn" },
      { key: "desc_vi", label: "Mô tả (VI)", type: "textarea", wide: true },
      { key: "desc_en", label: "Mô tả (EN)", type: "textarea", wide: true },
      { key: "access_level", label: "Quyền truy cập", type: "select", options: [["public", "Công khai"], ["member", "Thành viên (tương lai)"]], list: true },
      { key: "featured", label: "Nổi bật (nhãn AI)", type: "checkbox" },
      ...common,
    ],
  },
  {
    key: "guides", label: "Tài liệu HDSD", title: (r) => String(r.title),
    fields: [
      { key: "title", label: "Tên tài liệu", type: "text", required: true, wide: true, list: true },
      { key: "url", label: "Link tài liệu", type: "url", required: true, wide: true, help: "Google Drive / Docs hoặc *.ose.vn" },
      { key: "app_id", label: "Thuộc phần mềm", type: "ref", ref: "apps", nullable: true, list: true },
      { key: "lang", label: "Ngôn ngữ", type: "select", options: [["vi", "Tiếng Việt"], ["en", "English"], ["both", "Song ngữ"]] },
      ...common,
    ],
  },
  {
    key: "demos", label: "Demo clip", title: (r) => String(r.title_vi),
    fields: [
      { key: "title_vi", label: "Tiêu đề (VI)", type: "text", required: true, list: true },
      { key: "title_en", label: "Tiêu đề (EN)", type: "text", required: true },
      { key: "url", label: "Link video", type: "url", required: true, wide: true, list: true, help: "Link YouTube hoặc Google Drive (/file/d/…) phát ngay trên trang; LinkedIn/Facebook mở tab mới. File Drive phải chia sẻ \"Bất kỳ ai có đường liên kết\"" },
      { key: "app_id", label: "Phần mềm liên quan", type: "ref", ref: "apps", nullable: true },
      { key: "desc_vi", label: "Mô tả (VI)", type: "textarea" },
      { key: "desc_en", label: "Mô tả (EN)", type: "textarea" },
      ...common,
    ],
  },
  {
    key: "courses", label: "Khoá học", title: (r) => String(r.title_vi),
    fields: [
      { key: "title_vi", label: "Tên khoá (VI)", type: "text", required: true, list: true },
      { key: "title_en", label: "Tên khoá (EN)", type: "text", required: true },
      { key: "url", label: "Link bài giảng", type: "url", required: true, wide: true, list: true },
      { key: "desc_vi", label: "Mô tả (VI)", type: "textarea" },
      { key: "desc_en", label: "Mô tả (EN)", type: "textarea" },
      ...common,
    ],
  },
  {
    key: "groups", label: "Nhóm phần mềm", title: (r) => String(r.name_vi),
    fields: [
      { key: "code", label: "Mã (I, II…)", type: "text", list: true },
      { key: "name_vi", label: "Tên nhóm (VI)", type: "text", required: true, list: true },
      { key: "name_en", label: "Tên nhóm (EN)", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "icon", label: "Biểu tượng", type: "select", options: [["foundation", "Nền tảng"], ["forecasting", "Dự báo"], ["logistics", "Logistics"], ["port", "Cảng"], ["design", "Thiết kế"], ["management", "Quản lý"]] },
      { key: "desc_vi", label: "Mô tả (VI)", type: "textarea", wide: true },
      { key: "desc_en", label: "Mô tả (EN)", type: "textarea", wide: true },
      ...common,
    ],
  },
  {
    key: "links", label: "Liên kết About", title: (r) => String(r.label_vi),
    fields: [
      { key: "kind", label: "Loại", type: "select", list: true, options: [["email", "Email (mục Liên hệ)"], ["phone", "Hotline (mục Liên hệ)"], ["zalo", "Zalo (mục Liên hệ)"], ["website", "Website"], ["linkedin", "LinkedIn"], ["researchgate", "ResearchGate"], ["facebook", "Facebook"], ["youtube", "YouTube"], ["other", "Khác"]] },
      { key: "label_vi", label: "Nhãn (VI)", type: "text", required: true, list: true },
      { key: "label_en", label: "Nhãn (EN)", type: "text", required: true },
      { key: "url", label: "Link", type: "url", required: true, wide: true, list: true, help: "https://…  ·  Email: mailto:quynm@portlogistics.vn  ·  Điện thoại: tel:+84913567101  ·  Zalo: https://zalo.me/<số>" },
      ...common,
    ],
  },
];

export function emptyRow(def: EntityDef): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (f.type === "checkbox") row[f.key] = f.key === "visible";
    else if (f.type === "number") row[f.key] = 0;
    else if (f.type === "select") row[f.key] = f.options?.[0]?.[0] ?? "";
    else if (f.type === "ref") row[f.key] = null;
    else row[f.key] = "";
  }
  return row;
}
