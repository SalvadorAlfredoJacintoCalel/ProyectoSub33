# ── Frontend (React + Vite) ──────────────────────────────────────────
# Etapa 1: compilar la app
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL relativa de la API → nginx hace el proxy a /api
ENV VITE_API_BASE_URL=/api

RUN npm run build

# Etapa 2: servir los estáticos con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
