/**
 * 자동생성 파일(플레이스홀더) — 직접 수정 금지.
 *
 * 게이트웨이가 뜬 뒤 `pnpm codegen` 을 실행하면
 * `$VITE_API_BASE_URL/v3/api-docs/all` 통합 스펙에서 이 파일이 통째로 재생성된다.
 * 지금은 시드 슬라이스(product)가 컴파일·검증되도록 최소 경로만 손으로 채워 둔 임시본이다.
 */
export interface paths {
  "/api/v1/products": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["getProducts"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    Product: {
      id: string;
      name: string;
      priceAmount: number;
      thumbnailUrl?: string;
    };
    ProductPage: {
      content: components["schemas"]["Product"][];
      totalElements: number;
      page: number;
      size: number;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export interface operations {
  getProducts: {
    parameters: {
      query?: {
        page?: number;
        size?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ProductPage"];
        };
      };
    };
  };
}
