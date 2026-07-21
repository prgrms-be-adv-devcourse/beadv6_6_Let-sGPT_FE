import { z } from "zod";
import { pageResponseSchema } from "@/shared/api/pagination";

/**
 * 신뢰 경계(§6.1) 런타임 스키마 — BE `ProductResponse` 와 일치.
 * 코드젠 타입은 컴파일 타임에만 존재하므로, 실제 응답은 여기서 Zod 로 한 번 더 검증한다.
 */
export const productSchema = z.object({
  id: z.string(),
  sellerId: z.string(),
  // BE ProductResponse.sellerName(판매자 스토어 표시명) — 미연동 시 null 가능 → nullish.
  sellerName: z.string().nullish(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  price: z.number().nullable(),
  thumbnailKey: z.string().nullable(),
  // BE ProductResponse.imageKeys(추가 이미지 갤러리) — 목 응답엔 없을 수 있어 nullish.
  imageKeys: z.array(z.string()).nullish(),
  createdAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const productPageSchema = pageResponseSchema(productSchema);
export type ProductPage = z.infer<typeof productPageSchema>;

/**
 * presign 발급 응답(`POST /api/v1/products/images/presign`) — S3 staging 직행 PUT 용.
 * stagingKey: promote 전 staging 객체 키(상품 write body 로 그대로 전송) /
 * uploadUrl: 서명된 S3 PUT URL(Content-Type 서명 대상) / expiresAt: 서명 만료 ISO.
 */
export const presignedUploadSchema = z.object({
  stagingKey: z.string(),
  uploadUrl: z.string(),
  expiresAt: z.string(),
});
export type PresignedUpload = z.infer<typeof presignedUploadSchema>;

// ── 클라이언트 사전검증 상수(UX용 사전차단 — 진짜 게이트는 BE HeadObject) ──
// 잠정치 — BE 확정 시 동기화(BE Q1: 크기 상한 / Q2: 타입 화이트리스트).
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

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
  imageKeys?: string[];
};

/** 폼값(문자열) + 갤러리 키 → write 본문(빈 값은 생략). exactOptionalPropertyTypes 대응. */
export function toProductWriteBody(
  values: ProductFormValues,
  imageKeys: readonly string[] = [],
): ProductWriteBody {
  // imageKeys = 갤러리(추가 이미지) — 대표(thumbnailKey)는 중복 제외하고 보낸다.
  const gallery = imageKeys.filter((key) => key && key !== values.thumbnailKey);
  return {
    name: values.name,
    ...(values.description ? { description: values.description } : {}),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(values.price ? { price: Number(values.price) } : {}),
    ...(values.thumbnailKey ? { thumbnailKey: values.thumbnailKey } : {}),
    ...(gallery.length > 0 ? { imageKeys: gallery } : {}),
  };
}
