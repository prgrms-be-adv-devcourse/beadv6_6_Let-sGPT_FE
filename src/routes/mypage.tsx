import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ProfileSection } from "@/features/auth/ui/ProfileSection";
import { RecentOrdersSection } from "@/features/order/ui/RecentOrdersSection";
import { RefundHistorySection } from "@/features/payment/ui/RefundHistorySection";
import { WalletSection } from "@/features/payment/ui/WalletSection";
import { SellerSection } from "@/features/seller/ui/SellerSection";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/mypage")({
  beforeLoad: () => {
    if (!useAuthStore.getState().member) {
      throw redirect({ to: "/login" });
    }
  },
  component: MyPage,
});

type TabKey = "profile" | "orders" | "wallet" | "refunds" | "seller";

const TABS = [
  { key: "profile", label: "내 정보", description: "계정 정보와 닉네임·비밀번호를 관리합니다." },
  { key: "orders", label: "주문 내역", description: "최근 주문을 확인합니다." },
  { key: "wallet", label: "지갑", description: "잔액을 확인하고 충전합니다." },
  { key: "refunds", label: "환불 이력", description: "환불 처리 내역을 확인합니다." },
  { key: "seller", label: "판매자", description: "판매자 정보를 관리하거나 전환합니다." },
] as const satisfies { key: TabKey; label: string; description: string }[];

function MyPage() {
  const member = useAuthStore((state) => state.member);
  const [tab, setTab] = useState<TabKey>("profile");
  const current = TABS.find((item) => item.key === tab) ?? TABS[0];

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
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors",
                tab === item.key
                  ? "bg-surface font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="min-w-0 space-y-6">
          <div className="space-y-1 border-border border-b pb-4">
            <h2 className="font-medium text-lg">{current.label}</h2>
            <p className="text-muted-foreground text-sm">{current.description}</p>
          </div>

          {tab === "profile" ? <ProfileSection /> : null}
          {tab === "orders" ? <RecentOrdersSection /> : null}
          {tab === "wallet" ? <WalletSection /> : null}
          {tab === "refunds" ? <RefundHistorySection /> : null}
          {tab === "seller" ? <SellerSection /> : null}
        </section>
      </div>
    </div>
  );
}
