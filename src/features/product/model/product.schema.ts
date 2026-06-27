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

// ── 판매자 상품 등록/수정 폼 (BE ProductCreateRequest/ProductUpdateRequest 제약과 일치) ──
const optionalDigits = (label: string) =>
  z
    .string()
    .refine((value) => value === "" || /^\d+$/.test(value), `${label}은(는) 숫자만 입력하세요.`)
    .refine((value) => value === "" || Number(value) > 0, `${label}은(는) 0보다 커야 합니다.`);

export const productFormSchema = z.object({
  name: z.string().min(1, "상품명을 입력하세요.").max(100, "상품명은 100자 이하여야 합니다."),
  description: z.string().max(2000, "설명은 2000자 이하여야 합니다."),
  categoryId: z.string(),
  price: optionalDigits("가격"),
  thumbnailKey: z.string().max(512, "썸네일 키는 512자 이하여야 합니다."),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

/** BE 로 보낼 상품 write 본문 — `ProductCreateRequest`/`ProductUpdateRequest`. */
export type ProductWriteBody = {
  name: string;
  description?: string;
  categoryId?: string;
  price?: number;
  thumbnailKey?: string;
};

/** 폼값(문자열) → write 본문(빈 값은 생략). exactOptionalPropertyTypes 대응. */
export function toProductWriteBody(values: ProductFormValues): ProductWriteBody {
  return {
    name: values.name,
    ...(values.description ? { description: values.description } : {}),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(values.price ? { price: Number(values.price) } : {}),
    ...(values.thumbnailKey ? { thumbnailKey: values.thumbnailKey } : {}),
  };
}
