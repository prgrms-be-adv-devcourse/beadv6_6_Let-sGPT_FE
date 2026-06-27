import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useCreateDrop } from "../api/drops.queries";
import { type DropFormValues, dropFormSchema, toDropCreateBody } from "../model/drop.schema";

type Props = {
  productId: string;
  sellerInfoId: string;
};

/** 판매자 드롭 생성 폼 — 상품 관리 상세에서 해당 상품의 드롭을 등록. */
export function DropCreateForm({ productId, sellerInfoId }: Props) {
  const create = useCreateDrop();
  const form = useForm<DropFormValues>({
    resolver: zodResolver(dropFormSchema),
    defaultValues: {
      dropPrice: "",
      totalQuantity: "",
      limitPerUser: "",
      openAt: "",
      closeAt: "",
    },
  });

  function onSubmit(values: DropFormValues) {
    create.mutate(
      { sellerInfoId, body: toDropCreateBody(productId, values) },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dropPrice"
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
          <FormField
            control={form.control}
            name="totalQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>총 수량</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="limitPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1인 한도 (선택)</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="제한 없음" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="hidden sm:block" />
          <FormField
            control={form.control}
            name="openAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>오픈 시각</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="closeAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료 시각 (선택)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {create.isError ? <p className="text-destructive text-sm">{create.error.message}</p> : null}
        {create.isSuccess ? (
          <p className="text-muted-foreground text-sm">드롭이 등록되었습니다.</p>
        ) : null}

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "등록 중…" : "드롭 등록"}
        </Button>
      </form>
    </Form>
  );
}
