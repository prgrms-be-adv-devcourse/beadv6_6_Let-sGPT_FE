import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/** Vitest(node) 환경용 목 서버 — test/setup.ts 에서 라이프사이클을 건다. */
export const server = setupServer(...handlers);
