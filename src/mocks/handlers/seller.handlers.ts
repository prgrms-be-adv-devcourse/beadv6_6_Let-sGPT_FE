import { HttpResponse, http } from "msw";

import type { SellerInfo } from "@/features/seller/model/seller.schema";

const sellerInfos: SellerInfo[] = [
  { id: "s-1", businessNumber: "123-45-67890", storeName: "오픈앳 스튜디오", active: true },
];

export const sellerHandlers = [
  http.get("*/api/v1/seller/me", () => HttpResponse.json(sellerInfos)),

  http.post("*/api/v1/seller/me", async ({ request }) => {
    const body = (await request.json()) as { businessNumber: string; storeName: string };
    const created: SellerInfo = {
      id: crypto.randomUUID(),
      businessNumber: body.businessNumber,
      storeName: body.storeName,
      active: true,
    };
    sellerInfos.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("*/api/v1/seller/me/:id", async ({ params, request }) => {
    const body = (await request.json()) as { storeName: string };
    const info = sellerInfos.find((item) => item.id === params.id);
    if (!info) {
      return HttpResponse.json(
        { error: "SELLER_INFO_NOT_FOUND", message: "판매자정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    info.storeName = body.storeName;
    return HttpResponse.json(info);
  }),

  http.delete("*/api/v1/seller/me/:id", () => new HttpResponse(null, { status: 204 })),
];
