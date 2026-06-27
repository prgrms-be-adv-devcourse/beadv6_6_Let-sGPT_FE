import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useCategories } from "@/features/category/api/categories.queries";
import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { type ProductFormValues, productFormSchema } from "../model/product.schema";
import { ProductImageField } from "./ProductImageField";

const controlClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40";

type Props = {
  defaultValues: ProductFormValues;
  submitLabel: string;
  pending: boolean;
  errorMessage?: string | undefined;
  onSubmit: (values: ProductFormValues) => void;
};

/** 상품 등록·수정 공용 폼 — BE ProductCreate/UpdateRequest 필드와 1:1. */
export function ProductForm({
  defaultValues,
  submitLabel,
  pending,
  errorMessage,
  onSubmit,
}: Props) {
  const categories = useCategories();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // 추가 이미지는 FE 상태로 보관(BE 는 대표=thumbnailKey 만 저장). 수정 시 기존 썸네일로 초기화.
  const [images, setImages] = useState<string[]>(() =>
    defaultValues.thumbnailKey ? [defaultValues.thumbnailKey] : [],
  );
  const thumbnail = form.watch("thumbnailKey");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상품명</FormLabel>
              <FormControl>
                <Input placeholder="한정판 스니커즈" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>설명</FormLabel>
              <FormControl>
                <textarea
                  rows={4}
                  placeholder="소재·핏·시즌 등 상품 설명"
                  className={controlClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리</FormLabel>
              <FormControl>
                <select className={controlClass} {...field}>
                  <option value="">미분류</option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>판매가 (원)</FormLabel>
              <FormControl>
                <Input inputMode="numeric" placeholder="219000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ProductImageField
          images={images}
          onImagesChange={setImages}
          thumbnail={thumbnail}
          onThumbnailChange={(url) => form.setValue("thumbnailKey", url, { shouldDirty: true })}
        />

        {errorMessage ? <p className="text-destructive text-sm">{errorMessage}</p> : null}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "처리 중…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
