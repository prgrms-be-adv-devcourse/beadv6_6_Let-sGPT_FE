import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useMe, useUpdateMember } from "../api/auth.queries";
import { type ProfileFormValues, profileFormSchema, type Role } from "../model/auth.schema";
import { useAuthStore } from "../store/authStore";

const ROLE_LABEL: Record<Role, string> = {
  ROLE_USER: "일반 회원",
  ROLE_SELLER: "판매자",
  ROLE_ADMIN: "관리자",
};

/** 내 정보 — 이메일·권한 표기 + 닉네임/비밀번호 수정(PATCH /me). */
export function ProfileSection() {
  const sessionMember = useAuthStore((state) => state.member);
  const me = useMe();
  const member = me.data ?? sessionMember;
  const update = useUpdateMember();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { nickname: member?.nickname ?? "", password: "", confirmPassword: "" },
  });

  // 서버 닉네임이 도착하면 폼 기본값을 동기화 — 단, 사용자가 수정 중(dirty)이면 입력을 덮어쓰지 않는다.
  const { reset } = form;
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    if (member && !isDirty) {
      reset({ nickname: member.nickname, password: "", confirmPassword: "" });
    }
  }, [member, isDirty, reset]);

  function onSubmit(values: ProfileFormValues) {
    const body: { nickname?: string; password?: string } = {};
    if (values.nickname !== member?.nickname) {
      body.nickname = values.nickname;
    }
    if (values.password !== "") {
      body.password = values.password;
    }
    if (Object.keys(body).length === 0) {
      return;
    }
    // 비밀번호 입력은 성공 시에만 비운다 — 실패하면 입력을 보존해 재시도 가능하게.
    update.mutate(body, {
      onSuccess: () => {
        form.setValue("password", "");
        form.setValue("confirmPassword", "");
      },
    });
  }

  if (!member) {
    return <p className="text-muted-foreground text-sm">회원 정보를 불러오는 중…</p>;
  }

  return (
    <div className="space-y-8">
      <dl className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm">
        <div className="flex items-center justify-between bg-card px-4 py-3">
          <dt className="text-muted-foreground">이메일</dt>
          <dd>{member.email}</dd>
        </div>
        <div className="flex items-center justify-between bg-card px-4 py-3">
          <dt className="text-muted-foreground">권한</dt>
          <dd>{ROLE_LABEL[member.role]}</dd>
        </div>
      </dl>

      <div className="space-y-4">
        <h3 className="font-medium">회원 정보 수정</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>닉네임</FormLabel>
                  <FormControl>
                    <Input autoComplete="nickname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>새 비밀번호</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="변경할 때만 입력"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>새 비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {update.isError ? (
              <p className="text-destructive text-sm">{update.error.message}</p>
            ) : null}
            {update.isSuccess ? (
              <p className="text-muted-foreground text-sm">변경 사항이 저장되었습니다.</p>
            ) : null}

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "저장 중…" : "변경 사항 저장"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
