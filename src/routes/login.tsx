import { createFileRoute, Link } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/ui/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-8 sm:py-14">
      <h1 className="font-serif text-3xl tracking-tight">로그인</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        openAt 계정으로 한정판 드롭에 참여하세요.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-muted-foreground text-sm">
        아직 계정이 없으신가요?{" "}
        <Link to="/signup" className="text-foreground underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </div>
  );
}
