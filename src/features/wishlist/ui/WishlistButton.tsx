import { useLocation, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "@/shared/lib/utils";
import { useToggleWishlist, useWishlistIds } from "../api/wishlist.queries";

type WishlistButtonProps = {
  productId: string;
  /**
   * - "icon": 카드 오버레이용 — 배경 칩 없이 은은한 하트(이미지 위에 얹힘).
   * - "detail": 상품 상세 액션용 — 아이콘 전용, 더 큰 원형 터치 타깃.
   */
  variant?: "icon" | "detail";
  className?: string;
};

/**
 * 상품 찜 토글. 로그인 필요 — 비로그인 시 클릭하면 로그인 화면으로(복귀 redirect 동봉).
 * 카드(Link 내부)에 얹을 수 있게 클릭 시 기본 내비게이션을 막는다.
 */
export function WishlistButton({ productId, variant = "icon", className }: WishlistButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { ids, isLoggedIn } = useWishlistIds();
  const toggle = useToggleWishlist();
  const wished = ids.has(productId);

  function handleClick(event: MouseEvent) {
    // 카드 링크 내부에 있을 수 있어 상위 내비게이션을 막는다.
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      navigate({ to: "/login", search: { redirect: location.href } });
      return;
    }
    toggle.mutate({ productId, wished: !wished });
  }

  const label = wished ? "찜 해제" : "찜하기";
  const isDetail = variant === "detail";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={wished}
      aria-label={label}
      title={label}
      className={cn(
        "grid place-items-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50",
        isDetail
          ? // 상세: 아이콘 전용, 큰 터치 타깃. 은은한 테두리로 액션임을 표시.
            "size-11 border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          : // 카드: 배경 칩 없이 이미지에 녹아드는 은은한 하트(가독성용 옅은 그림자만).
            "size-8 text-foreground/60 hover:text-foreground",
        className,
      )}
    >
      <Heart
        className={cn(
          isDetail ? "size-5" : "size-4 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.25)]",
          wished && "fill-current text-destructive",
        )}
      />
    </button>
  );
}
