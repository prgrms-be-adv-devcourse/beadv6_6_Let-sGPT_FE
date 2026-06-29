/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// 플러그인 순서 주의: tanstackRouter 는 반드시 react 보다 먼저 와야 한다(라우트 코드 생성/변환 선행).
export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // 테스트는 apiFetch/image 의 `new URL(path, VITE_API_BASE_URL)` 에 유효한 base 가 필요하다.
    // 실제 호출은 MSW 가 가로채므로 값 자체는 임의의 유효 URL 이면 된다. .env 는 gitignore 라
    // CI 엔 없어 base 가 undefined → "Invalid URL" 로 깨졌다. 커밋되는 이 설정에 고정한다.
    env: { VITE_API_BASE_URL: "http://localhost:8000" },
  },
});
