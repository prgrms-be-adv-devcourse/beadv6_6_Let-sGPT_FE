import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

/** dev 서버용 Service Worker (VITE_API_MOCKING=enabled 일 때 main.tsx 에서 기동). */
export const worker = setupWorker(...handlers);
