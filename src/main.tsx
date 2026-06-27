import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/providers";
import "@/app/styles/globals.css";

// VITE_API_MOCKING=enabled 일 때만 MSW 워커를 띄워 BE 없이 전체 루프를 돌린다(§5).
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== "enabled") {
    return;
  }
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("#root 엘리먼트를 찾을 수 없습니다.");
  }
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
});
