import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { useLogin } from "../api/auth.queries";
import { type LoginFormValues, loginFormSchema } from "../model/auth.schema";

/** @param redirectTo 로그인 성공 후 이동할 경로(보호 라우트에서 넘어온 복귀 목적지). 없으면 홈으로. */
export function LoginForm({ redirectTo }: { redirectTo?: string | undefined }) {
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values, {
      onSuccess: () => navigate({ to: redirectTo ?? "/" }),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
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
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {login.isError ? <p className="text-destructive text-sm">{login.error.message}</p> : null}

        <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
          {login.isPending ? "로그인 중…" : "로그인"}
        </Button>
      </form>
    </Form>
  );
}
