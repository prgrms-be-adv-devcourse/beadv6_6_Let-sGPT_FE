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
