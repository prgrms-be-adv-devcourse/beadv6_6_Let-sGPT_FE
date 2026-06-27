import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스 조건부 결합 + 충돌 머지 (shadcn 표준 유틸). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
