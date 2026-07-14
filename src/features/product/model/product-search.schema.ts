import { z } from "zod";

export const productSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  sellerName: z.string().nullish(),
  price: z.number().nullable(),
  thumbnailKey: z.string().nullable(),
  imgDescription: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
  deletedAt: z.string().nullish(),
  score: z.number().nullish(),
});

export const productSearchPageSchema = z.object({
  content: z.array(productSearchResultSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type ProductSearchSort = "createdAt,desc" | "price,asc" | "price,desc";
export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;
export type ProductSearchPage = z.infer<typeof productSearchPageSchema>;
