import { Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = "불러오는 중", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
