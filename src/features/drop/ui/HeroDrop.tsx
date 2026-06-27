import { formatDateTime, formatKrw } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/ImagePlaceholder";
import { useUpcomingDrops } from "../api/drops.queries";
import { Countdown } from "./Countdown";

/** 홈 히어로 — 가장 가까운 오픈 예정 드롭을 카운트다운과 함께 에디토리얼하게 강조. */
export function HeroDrop() {
  const { data } = useUpcomingDrops();
  const nextDrop = data?.content[0];

  return (
    <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className="order-2 lg:order-1">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.25em]">
          Next Drop · 오픈 예정
        </p>

        {nextDrop ? (
          <>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              {nextDrop.productName}
            </h1>
            <div className="mt-5 flex items-center gap-4">
              <span className="font-medium text-lg tabular-nums">
                {formatKrw(nextDrop.dropPrice)}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground text-sm">
                {formatDateTime(nextDrop.openAt)} 오픈
              </span>
            </div>
            <Countdown target={nextDrop.openAt} className="mt-9" />
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg">알림 받기</Button>
              <Button size="lg" variant="outline">
                자세히 보기
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              한정판은 순간이다
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              지금 진행 중인 드롭을 둘러보세요. 새로운 드롭이 열리면 가장 먼저 알려드립니다.
            </p>
          </>
        )}
      </div>

      <div className="order-1 overflow-hidden rounded-lg bg-surface lg:order-2">
        <div className="aspect-[16/10] lg:aspect-[4/5]">
          <ImagePlaceholder name={nextDrop?.productName ?? "openAt"} />
        </div>
      </div>
    </section>
  );
}
