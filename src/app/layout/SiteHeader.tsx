import { Link } from "@tanstack/react-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Button } from "@/shared/ui/button";

const navLinkClass =
  "text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground";

function AuthActions() {
  const member = useAuthStore((state) => state.member);
  const clear = useAuthStore((state) => state.clear);

  if (member) {
    return (
      <>
        {member.role === "ROLE_ADMIN" ? (
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/admin">관리자</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link to="/orders">주문</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link to="/mypage">{member.nickname}</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => clear()}>
          로그아웃
        </Button>
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

function SellerSelect() {
  // TODO(fe-api): 판매자 목록 조회(member 도메인) — 헤더 판매자 필터. 현재는 비활성 플레이스홀더. [screens/01-home]
  return (
    <select
      aria-label="판매자 선택"
      defaultValue=""
      disabled
      className="hidden h-9 border-0 bg-transparent text-muted-foreground text-sm sm:block"
    >
      <option value="">전체 판매자</option>
    </select>
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
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <SellerSelect />
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
