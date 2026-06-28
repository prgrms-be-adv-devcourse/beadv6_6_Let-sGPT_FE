import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

type Props = {
  /** 다이얼로그를 여는 트리거(asChild 로 병합). */
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 파괴적 액션이면 확인 버튼을 destructive 로(기본은 모노크롬 블랙). */
  tone?: "default" | "destructive";
  onConfirm: () => void;
};

/**
 * 에디토리얼 미니멀 결의 확인 다이얼로그(Radix Dialog) — 중앙 카드 + 헤어라인 보더.
 * 로그아웃·삭제·취소 등 되돌리기 어려운 액션 전 공용 확인 컨펌으로 사용.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "default",
  onConfirm,
}: Props) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <DialogPrimitive.Content className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg duration-200 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in">
          <DialogPrimitive.Title className="font-medium text-lg">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-2 text-muted-foreground text-sm">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" size="sm">
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant={tone === "destructive" ? "destructive" : "default"}
                size="sm"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
