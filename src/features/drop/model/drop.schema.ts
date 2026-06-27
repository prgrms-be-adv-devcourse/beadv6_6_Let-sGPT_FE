import { z } from "zod";
import { pageResponseSchema } from "@/shared/api/pagination";

/** BE `com.openat.drop.domain.model.DropStatus` 와 일치. */
export const dropStatusSchema = z.enum(["REGISTERED", "OPEN", "CLOSE", "SOLD_OUT"]);
export type DropStatus = z.infer<typeof dropStatusSchema>;

/**
 * 홈 카드/목록 표시용 드롭 모델(FE 임시 계약).
 * BE Drop 엔티티(dropPrice·totalQuantity·openAt·status 등) + 표시용 product 필드(productName·thumbnailKey)
 * + 재고 게이트키퍼의 remainingQuantity 를 합친 형태를 가정한다. 실제 조회 API는 미구현 → drops.api.ts 참조.
 */
export const dropCardSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  thumbnailKey: z.string().nullable(),
  dropPrice: z.number(),
  totalQuantity: z.number(),
  remainingQuantity: z.number(),
  status: dropStatusSchema,
  openAt: z.string(),
  closeAt: z.string().nullable(),
});
export type DropCard = z.infer<typeof dropCardSchema>;

export const dropCardPageSchema = pageResponseSchema(dropCardSchema);
export type DropCardPage = z.infer<typeof dropCardPageSchema>;
