import type * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * 카테고리·메타 라벨용 소프트 태그(에디토리얼 미니멀).
 * 테두리 대신 아주 옅은 틴트 + 트래킹된 소형 텍스트로 모던하게 표현.
 */
export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-foreground/[0.05] px-2.5 py-1 font-medium text-[0.7rem] text-muted-foreground leading-none tracking-[0.06em]",
        className,
      )}
      {...props}
    />
  );
}
