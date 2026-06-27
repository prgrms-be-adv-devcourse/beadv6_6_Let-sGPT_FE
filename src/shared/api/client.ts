import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * 게이트웨이를 향하는 단일 타입드 HTTP 클라이언트.
 * 경로/파라미터/응답 타입은 모두 코드젠 산출물(`schema.d.ts`)에서 온다 →
 * 계약이 바뀌면 호출부가 컴파일 에러로 즉시 드러난다(§6.1).
 */
export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  // fetch 를 "생성 시점"이 아니라 "호출 시점"에 해석한다.
  // openapi-fetch 는 createClient 시 globalThis.fetch 를 캡처하는데, 이 클라이언트는
  // 모듈 로드(=MSW 설치 이전)에 생성되므로 그대로 두면 테스트에서 목 서버를 우회한다.
  fetch: (...args) => fetch(...args),
});
