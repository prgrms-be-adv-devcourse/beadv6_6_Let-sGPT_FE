import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

const navLinkClass =
  "text-muted-foreground hover:text-foreground [&.active]:font-medium [&.active]:text-foreground";

function SellerSelect() {
  // TODO(fe-api): 판매자 목록 조회(member 도메인) — 헤더 "판매자 선택 드롭다운".
  // 선택 시 해당 판매자 상품/드롭으로 필터링. 현재는 비활성 플레이스홀더. [screens/01-home]
  return (
    <select
      aria-label="판매자 선택"
      defaultValue=""
      disabled
      className="h-8 rounded-md border bg-background px-2 text-muted-foreground text-sm"
    >
      <option value="">판매자 선택</option>
    </select>
  );
}

/** 전 화면 공통 상단 내비게이션(앱 셸). 라우트 진입점을 얇게 유지하기 위해 헤더 chrome 을 분리. */
export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <Link to="/" className="font-bold text-lg">
          Let'sGPT
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/drops" className={navLinkClass}>
            드롭
          </Link>
          <Link to="/products" className={navLinkClass}>
            전체 상품
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SellerSelect />
          {/* 비로그인 상태 표시. 인증(member 도메인)은 후속 구현 — 현재는 시각 플레이스홀더. */}
          <Button variant="ghost" size="sm">
            로그인
          </Button>
          <Button size="sm">회원가입</Button>
        </div>
      </div>
    </header>
  );
}
