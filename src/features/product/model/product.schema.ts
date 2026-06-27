import { z } from "zod";

/**
 * 신뢰 경계(§6.1) 런타임 스키마.
 * 코드젠 타입은 컴파일 타임에만 존재하므로, 실제 응답은 여기서 Zod 로 한 번 더 검증한다.
 */
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceAmount: z.number(),
  thumbnailUrl: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;

export const productPageSchema = z.object({
  content: z.array(productSchema),
  totalElements: z.number(),
  page: z.number(),
  size: z.number(),
});

export type ProductPage = z.infer<typeof productPageSchema>;
