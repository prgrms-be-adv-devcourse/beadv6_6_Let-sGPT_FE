import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenPage,
});

/** 로그인했지만 해당 페이지 접근 권한이 없는 경우의 안내(역할 가드가 보냄). */
function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center sm:py-24">
      <p className="font-serif text-5xl tracking-tight tabular-nums">403</p>
      <h1 className="mt-4 font-serif text-2xl tracking-tight">접근 권한이 없습니다</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        이 페이지를 볼 수 있는 권한이 계정에 없습니다.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link to="/">홈으로</Link>
      </Button>
    </div>
  );
}
