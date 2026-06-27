import { createFileRoute, Link } from "@tanstack/react-router";

import { SignupForm } from "@/features/auth/ui/SignupForm";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="mx-auto max-w-sm py-8 sm:py-14">
      <h1 className="font-serif text-3xl tracking-tight">회원가입</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        이메일로 가입하고 드롭 알림을 가장 먼저 받아보세요.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-6 text-muted-foreground text-sm">
        이미 계정이 있으신가요?{" "}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          로그인
        </Link>
      </p>
    </div>
  );
}
