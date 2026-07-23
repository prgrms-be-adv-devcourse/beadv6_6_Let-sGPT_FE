import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * 셀러명(브랜드) → 브랜드 상품 모아보기(`/brands/$name`) 이동.
 * 카드가 이미 `<Link>` 로 감싸진 경우(추천/상품 카드)가 있어 중첩 앵커를 피하려
 * 앵커 대신 프로그램 방식 내비게이션(button + stopPropagation)으로 통일한다.
 */
export function BrandLink({ sellerName, className }: { sellerName: string; className?: string }) {
  const navigate = useNavigate();

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    navigate({ to: "/brands/$name", params: { name: sellerName } });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "underline-offset-4 transition-colors hover:text-foreground hover:underline",
        className,
      )}
    >
      {sellerName}
    </button>
  );
}
