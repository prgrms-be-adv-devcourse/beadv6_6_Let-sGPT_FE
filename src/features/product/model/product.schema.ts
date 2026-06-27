import { z } from "zod";
import { pageResponseSchema } from "@/shared/api/pagination";

/**
 * 신뢰 경계(§6.1) 런타임 스키마 — BE `ProductResponse` 와 일치.
 * 코드젠 타입은 컴파일 타임에만 존재하므로, 실제 응답은 여기서 Zod 로 한 번 더 검증한다.
 */
export const productSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  price: z.number().nullable(),
  thumbnailKey: z.string().nullable(),
  createdAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const productPageSchema = pageResponseSchema(productSchema);
export type ProductPage = z.infer<typeof productPageSchema>;
