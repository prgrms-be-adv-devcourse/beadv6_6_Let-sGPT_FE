/**
 * 자동생성 파일(플레이스홀더) — 직접 수정 금지.
 *
 * 게이트웨이가 뜬 뒤 `pnpm codegen` 을 실행하면
 * `$VITE_API_BASE_URL/v3/api-docs/all` 통합 스펙에서 이 파일이 통째로 재생성된다.
 * 지금은 BE 실계약(ProductController/ProductResponse/PageResponse)을 손으로 옮겨 둔 임시본이다.
 */
export interface paths {
  "/api/v1/products": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["searchProducts"];
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
    /** `com.openat.product.presentation.dto.ProductResponse` */
    Product: {
      id: string;
      sellerId: string;
      name: string;
      description: string;
      /** 카테고리 id, null: 미분류 */
      categoryId: string | null;
      /** 카테고리명, null: 미분류 */
      categoryName: string | null;
      /** 판매가, null: 가격 미정 */
      price: number | null;
      /** 썸네일 키, null: 이미지 없음 */
      thumbnailKey: string | null;
      /** 생성 일시(ISO-8601) */
      createdAt: string;
    };
    /** `com.openat.common.response.PageResponse<ProductResponse>` */
    ProductPage: {
      content: components["schemas"]["Product"][];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
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
  searchProducts: {
    parameters: {
      query?: {
        categoryId?: string;
        keyword?: string;
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
