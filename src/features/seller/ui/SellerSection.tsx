import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useCreateSellerInfo, useMySellerInfos } from "../api/sellers.queries";
import { type SellerRegisterFormValues, sellerRegisterFormSchema } from "../model/seller.schema";

/** 판매자 정보 관리 — 등록된 판매자정보 목록 + 신규 등록(판매자 등록). */
export function SellerSection() {
  const sellers = useMySellerInfos();
  const create = useCreateSellerInfo();
  const member = useAuthStore((state) => state.member);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();
  // 최초 승격(USER→SELLER) 후 권한 반영을 위해 재로그인이 필요함을 알리는 모달.
  const [reloginOpen, setReloginOpen] = useState(false);
  const form = useForm<SellerRegisterFormValues>({
    resolver: zodResolver(sellerRegisterFormSchema),
    defaultValues: { businessNumber: "", storeName: "" },
  });

  // USER 가 처음 판매자정보를 등록하면 BE 가 roles=SELLER 로 승격하지만, 회원 JWT 에 반영하려면
  // refresh/재로그인이 필요하다. 이미 SELLER 면(추가 스토어 등록) 재로그인 없이 목록만 갱신.
  const needsRelogin = member?.role === "ROLE_USER";

  function onSubmit(values: SellerRegisterFormValues) {
    create.mutate(values, {
      onSuccess: () => {
        form.reset();
        if (needsRelogin) {
          setReloginOpen(true);
        }
      },
    });
  }

  function handleRelogin() {
    setReloginOpen(false);
    // 세션을 먼저 비운다 — /login 은 인증 상태면 홈으로 되돌리므로 clear 후 이동해야 한다.
    clear();
    void navigate({ to: "/login" });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-medium">내 판매자 정보</h3>
        {sellers.isLoading ? (
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
                      ? "rounded-full bg-foreground/[0.06] px-2.5 py-0.5 font-medium text-foreground text-xs"
                      : "rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs"
                  }
                >
                  {seller.active ? "활성" : "비활성"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            아직 등록된 판매자 정보가 없습니다. 아래에서 판매자로 등록하세요.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">판매자 등록</h3>
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
            {create.isSuccess && !needsRelogin ? (
              <p className="text-muted-foreground text-sm">판매자 등록이 완료되었습니다.</p>
            ) : null}

            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "등록 중…" : "판매자 등록"}
            </Button>
          </form>
        </Form>
      </div>

      <Dialog
        open={reloginOpen}
        onOpenChange={(open) => {
          if (!open) setReloginOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>판매자 등록 완료</DialogTitle>
            <DialogDescription>
              판매자 권한 적용을 위해 다시 로그인해야 합니다. 지금 로그아웃하고 로그인 화면으로
              이동합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleRelogin}>
              다시 로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
