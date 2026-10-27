# ── Frontend (React + Vite) ──────────────────────────────────────────
# Etapa 1: compilar la app
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL de la API (se inyecta en build time; Vite la inlinea en el bundle).
# Puedes pasarla con:  docker build --build-arg VITE_API_BASE_URL=https://...
# Por defecto apunta al backend desplegado en Render.
ARG VITE_API_BASE_URL=https://backend-sub33.onrender.com/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Etapa 2: servir los estáticos con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
