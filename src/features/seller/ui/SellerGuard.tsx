import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { useActiveSellerInfo } from "../api/sellers.queries";

type Props = {
  children: (sellerInfoId: string) => ReactNode;
};

/**
 * 판매자 콘솔 게이트 — 활성 판매자정보가 있어야 상품/드롭 write 가 가능(scoped 토큰의 resource).
 * 없으면 마이페이지의 판매자 전환으로 유도한다.
 */
export function SellerGuard({ children }: Props) {
  const { sellerInfo, isPending, isError } = useActiveSellerInfo();

  if (isPending) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
  }
  if (isError) {
    return (
      <p className="py-16 text-center text-destructive text-sm">
        판매자 정보를 불러오지 못했습니다.
      </p>
    );
  }
  if (!sellerInfo) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">판매자로 등록된 정보가 없습니다.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/mypage">판매자 전환하기</Link>
        </Button>
      </div>
    );
  }

  return <>{children(sellerInfo.id)}</>;
}
