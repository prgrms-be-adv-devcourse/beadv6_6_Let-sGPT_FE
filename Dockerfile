# ---- build stage ----
FROM node:22-alpine AS build
# git: prepare 훅(lefthook install)이 git hook을 심으려 하므로 필요. 빌드 스테이지 한정.
RUN apk add --no-cache git && corepack enable
WORKDIR /app
# pnpm-workspace.yaml 포함: pnpm 11은 빌드 스크립트 허용(allowBuilds)을 여기서 읽는다.
# 없으면 esbuild/@swc/core 등이 ERR_PNPM_IGNORED_BUILDS로 install 실패.
COPY pnpm-lock.yaml package.json .npmrc pnpm-workspace.yaml ./
# .git이 있어야 lefthook install이 성공한다(.dockerignore가 실제 .git을 제외하므로 빈 repo 초기화).
RUN git init -q && corepack pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_TOSS_CLIENT_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TOSS_CLIENT_KEY=$VITE_TOSS_CLIENT_KEY
RUN corepack pnpm routes:gen && corepack pnpm build   # -> /app/dist

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
