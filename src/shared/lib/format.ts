const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

/** 원화 통화 표기 (예: 219000 -> "₩219,000"). */
export function formatKrw(amount: number): string {
  return krwFormatter.format(amount);
}

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** ISO 8601 문자열을 한국 로캘 날짜·시각으로 표기. */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
