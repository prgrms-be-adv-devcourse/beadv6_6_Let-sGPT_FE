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
  // TODO(fe-api): BE DropResponse 에 판매자 표시명(storeName) 포함 필요 → 카탈로그/상세 벤더 표기. (provisional)
  sellerName: z.string().nullish(),
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

// ── 판매자 드롭 생성 폼 (BE DropCreateRequest 제약과 일치) ──────────────────
const requiredDigits = (label: string) =>
  z
    .string()
    .min(1, `${label}을(를) 입력하세요.`)
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) > 0,
      `${label}은(는) 0보다 큰 숫자여야 합니다.`,
    );

export const dropFormSchema = z
  .object({
    dropPrice: requiredDigits("판매가"),
    totalQuantity: requiredDigits("총 수량"),
    limitPerUser: z
      .string()
      .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0), "1 이상 숫자"),
    openAt: z.string().min(1, "오픈 시각을 선택하세요."),
    closeAt: z.string(),
  })
  .refine((values) => values.closeAt === "" || new Date(values.closeAt) > new Date(values.openAt), {
    message: "종료 시각은 오픈 시각 이후여야 합니다.",
    path: ["closeAt"],
  });
export type DropFormValues = z.infer<typeof dropFormSchema>;

/** BE 로 보낼 드롭 생성 본문 — `DropCreateRequest`(시각은 ISO Instant). */
export type DropCreateBody = {
  productId: string;
  dropPrice: number;
  totalQuantity: number;
  limitPerUser?: number;
  openAt: string;
  closeAt?: string;
};

/** datetime-local 폼값 → ISO 본문(빈 값 생략). */
export function toDropCreateBody(productId: string, values: DropFormValues): DropCreateBody {
  return {
    productId,
    dropPrice: Number(values.dropPrice),
    totalQuantity: Number(values.totalQuantity),
    ...(values.limitPerUser ? { limitPerUser: Number(values.limitPerUser) } : {}),
    openAt: new Date(values.openAt).toISOString(),
    ...(values.closeAt ? { closeAt: new Date(values.closeAt).toISOString() } : {}),
  };
}
