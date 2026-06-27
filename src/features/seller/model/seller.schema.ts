import { z } from "zod";

/** `SellerInfoResponse` (회원 1:N 판매자정보). */
export const sellerInfoSchema = z.object({
  id: z.string(),
  businessNumber: z.string(),
  storeName: z.string(),
  active: z.boolean(),
});
export type SellerInfo = z.infer<typeof sellerInfoSchema>;

export const sellerInfoListSchema = z.array(sellerInfoSchema);

/** 판매자 전환(등록) 폼 — 사업자등록번호 형식(000-00-00000)과 상호명. */
export const sellerRegisterFormSchema = z.object({
  businessNumber: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, "사업자등록번호 형식이 올바르지 않습니다. (예: 123-45-67890)"),
  storeName: z.string().min(1, "상호명을 입력하세요.").max(50, "상호명은 50자 이하여야 합니다."),
});
export type SellerRegisterFormValues = z.infer<typeof sellerRegisterFormSchema>;
