import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { ProfileSection } from "@/features/auth/ui/ProfileSection";
import { SellerDropList } from "@/features/drop/ui/SellerDropList";
import { RecentOrdersSection } from "@/features/order/ui/RecentOrdersSection";
import { RefundHistorySection } from "@/features/payment/ui/RefundHistorySection";
import { WalletSection } from "@/features/payment/ui/WalletSection";
import { SellerProductList } from "@/features/product/ui/SellerProductList";
import { useActiveSellerInfo } from "@/features/seller/api/sellers.queries";
import { SellerSection } from "@/features/seller/ui/SellerSection";
import { SettlementPanel } from "@/features/settlement/ui/SettlementPanel";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export const Route = createFileRoute("/_authed/mypage")({
  component: MyPage,
});

type TabKey =
  | "profile"
  | "orders"
  | "wallet"
  | "refunds"
  | "seller"
  | "products"
  | "drops"
  | "settlements";
type Item = { key: TabKey; label: string; description: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "쇼핑",
    items: [
      {
        key: "profile",
        label: "내 정보",
        description: "계정 정보와 닉네임·비밀번호를 관리합니다.",
      },
      { key: "orders", label: "주문 내역", description: "최근 주문을 확인합니다." },
      { key: "wallet", label: "지갑", description: "잔액을 확인하고 충전합니다." },
      { key: "refunds", label: "환불 이력", description: "환불 처리 내역을 확인합니다." },
    ],
  },
  {
    title: "판매",
    items: [
      { key: "seller", label: "판매자 정보", description: "판매자 정보를 관리하거나 전환합니다." },
      { key: "products", label: "상품 관리", description: "내 상품을 등록·수정합니다." },
      { key: "drops", label: "드롭 관리", description: "내 드롭을 확인하고 관리합니다." },
      { key: "settlements", label: "정산", description: "판매자·주문 단위 정산 내역입니다." },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((group) => group.items);

function MyPage() {
  const member = useAuthStore((state) => state.member);
  const [tab, setTab] = useState<TabKey>("profile");
  const seller = useActiveSellerInfo();
  const current = ALL_ITEMS.find((item) => item.key === tab);

  function renderContent() {
    if (tab === "profile") return <ProfileSection />;
    if (tab === "orders") return <RecentOrdersSection />;
    if (tab === "wallet") return <WalletSection />;
    if (tab === "refunds") return <RefundHistorySection />;
    if (tab === "seller") return <SellerSection />;

    // 판매 관리(상품·드롭·정산) — 활성 판매자 정보가 있어야 함.
    if (seller.isPending) {
      return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</p>;
    }
    if (seller.isError) {
      return (
        <p className="py-16 text-center text-destructive text-sm">
          판매자 정보를 불러오지 못했습니다.
        </p>
      );
    }
    if (!seller.sellerInfo) {
      return (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">먼저 판매자로 전환해야 합니다.</p>
          <Button variant="outline" className="mt-4" onClick={() => setTab("seller")}>
            판매자 정보로 이동
          </Button>
        </div>
      );
    }
    if (tab === "products") return <SellerProductList />;
    if (tab === "drops") return <SellerDropList />;
    return <SettlementPanel scope="seller" />;
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">Account</p>
        <h1 className="font-serif text-4xl tracking-tight">마이페이지</h1>
        {member ? (
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground">{member.nickname}</span>님, 환영합니다.
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {GROUPS.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <p className="px-3 pb-1 text-[0.65rem] text-muted-foreground uppercase tracking-[0.15em]">
                {group.title}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    tab === item.key
                      ? "bg-surface font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <section className="min-w-0 space-y-6">
          <div className="space-y-1 border-border border-b pb-4">
            <h2 className="font-medium text-lg">{current?.label}</h2>
            <p className="text-muted-foreground text-sm">{current?.description}</p>
          </div>
          {renderContent()}
        </section>
      </div>
    </div>
  );
}
