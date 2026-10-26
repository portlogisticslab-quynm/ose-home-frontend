# ---- OSE (ose.vn) — frontend (React + Vite, prerendered, served by Nginx) ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# Public site URL used in canonical/OG tags and sitemap; API bases are optional.
ARG VITE_SITE_URL=https://ose.vn
ARG VITE_API_BASE=
ARG VITE_API_FALLBACK=
ENV VITE_SITE_URL=$VITE_SITE_URL VITE_API_BASE=$VITE_API_BASE VITE_API_FALLBACK=$VITE_API_FALLBACK
RUN npm run test && npm run build

FROM nginx:1.27-alpine
# BACKEND_URL: where /api is proxied. Home Server: http://backend:8000 ; Render: https://<api>.onrender.com
ENV BACKEND_URL=http://backend:8000 PORT=8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --retries=3 CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
