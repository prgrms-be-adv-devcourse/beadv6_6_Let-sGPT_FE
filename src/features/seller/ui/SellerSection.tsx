import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useCreateSellerInfo, useMySellerInfos } from "../api/sellers.queries";
import { type SellerRegisterFormValues, sellerRegisterFormSchema } from "../model/seller.schema";

/** 판매자 정보 관리 — 등록된 판매자정보 목록 + 신규 등록(판매자 전환). */
export function SellerSection() {
  const sellers = useMySellerInfos();
  const create = useCreateSellerInfo();
  const form = useForm<SellerRegisterFormValues>({
    resolver: zodResolver(sellerRegisterFormSchema),
    defaultValues: { businessNumber: "", storeName: "" },
  });

  function onSubmit(values: SellerRegisterFormValues) {
    create.mutate(values, {
      onSuccess: () => form.reset(),
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-medium">내 판매자 정보</h3>
          {sellers.data && sellers.data.length > 0 ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/products">상품 관리</Link>
            </Button>
          ) : null}
        </div>
        {sellers.isPending ? (
          <p className="text-muted-foreground text-sm">불러오는 중…</p>
        ) : sellers.data && sellers.data.length > 0 ? (
          <ul className="divide-y divide-border border-border border-y">
            {sellers.data.map((seller) => (
              <li key={seller.id} className="flex items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium">{seller.storeName}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {seller.businessNumber}
                  </p>
                </div>
                <span
                  className={
                    seller.active
                      ? "rounded-full border border-live/40 px-2.5 py-0.5 text-live text-xs"
                      : "rounded-full border px-2.5 py-0.5 text-muted-foreground text-xs"
                  }
                >
                  {seller.active ? "활성" : "비활성"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            아직 등록된 판매자 정보가 없습니다. 아래에서 판매자로 전환하세요.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">판매자 전환</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="businessNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록번호</FormLabel>
                  <FormControl>
                    <Input placeholder="123-45-67890" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상호명</FormLabel>
                  <FormControl>
                    <Input placeholder="오픈앳 스튜디오" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {create.isError ? (
              <p className="text-destructive text-sm">{create.error.message}</p>
            ) : null}
            {create.isSuccess ? (
              <p className="text-muted-foreground text-sm">
                판매자 등록이 완료되었습니다. 다시 로그인하면 판매자 권한이 적용됩니다.
              </p>
            ) : null}

            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "등록 중…" : "판매자로 전환"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
