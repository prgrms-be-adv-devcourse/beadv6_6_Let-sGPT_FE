import { Link } from "@tanstack/react-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { SellerSwitcher } from "@/features/seller/ui/SellerSwitcher";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

const navLinkClass =
  "text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground";

function AuthActions() {
  const member = useAuthStore((state) => state.member);
  const clear = useAuthStore((state) => state.clear);

  if (member) {
    return (
      <>
        {member.role === "ROLE_SELLER" ? <SellerSwitcher /> : null}
        {member.role === "ROLE_ADMIN" ? (
          <Link to="/admin" className={cn(navLinkClass, "hidden sm:inline")}>
            Admin
          </Link>
        ) : null}
        <Link to="/orders" className={cn(navLinkClass, "hidden sm:inline")}>
          Orders
        </Link>
        <Link
          to="/mypage"
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          {member.nickname}
        </Link>
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm">
              로그아웃
            </Button>
          }
          title="로그아웃"
          description="정말 로그아웃하시겠어요?"
          confirmLabel="로그아웃"
          onConfirm={() => clear()}
        />
      </>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/login">로그인</Link>
      </Button>
      <Button asChild size="sm">
        <Link to="/signup">회원가입</Link>
      </Button>
    </>
  );
}

/** 전 화면 공통 상단 내비게이션(앱 셸) — 스티키 + 백드롭 블러의 미니멀 헤더. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-6">
        <Link to="/" className="font-serif text-2xl leading-none tracking-tight">
          openAt
        </Link>
        <nav className="hidden items-center gap-7 sm:flex">
          <Link to="/drops" className={navLinkClass}>
            Drops
          </Link>
          <Link to="/products" className={navLinkClass}>
            Shop
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
