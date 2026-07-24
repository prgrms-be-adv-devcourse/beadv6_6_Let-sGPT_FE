import { HttpResponse, http } from "msw";

import { type ChatStage, chatRequestSchema } from "@/features/chat/model/chat.schema";
import { uuid } from "@/shared/lib/id";
import { chatCapabilities } from "../data/chat";

const encoder = new TextEncoder();

function sse(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

function answerFor(prompt: string): string {
  if (prompt.includes("주문") && (prompt.includes("지난달") || prompt.includes("추이"))) {
    return "지난달 주문은 총 1,284건이야. 주별로는 월초보다 월말에 완만하게 증가했어.";
  }
  if (prompt.includes("결제") || prompt.includes("환불")) {
    return "지난주 결제 성공률은 97.2%이고 환불액은 320만 원이야.";
  }
  if (prompt.includes("정산") || prompt.includes("수수료")) {
    return "지난달 최종 정산액은 8,420만 원이고 수수료는 260만 원이야.";
  }
  if (prompt.includes("사가") || prompt.includes("보상") || prompt.includes("적체")) {
    return "10분 넘게 보상 중인 주문 사가는 2건이야. 운영자가 처리 흐름을 점검할 필요가 있어.";
  }
  if (prompt.includes("회원")) {
    return "현재 회원은 일반 회원 1,842명, 판매자 126명, 관리자 4명이야.";
  }
  if (prompt.includes("드롭")) {
    return "현재 드롭은 진행 중 8건, 예정 21건, 종료 37건이야.";
  }
  if (prompt.includes("날씨")) {
    return "오늘 부천은 대체로 맑고 최저 25도, 최고 32도이며 강수 확률은 20%야.";
  }
  if (prompt.includes("뉴스") || prompt.includes("검색")) {
    return "오늘 공개된 주요 AI 소식을 확인했어. 제품 업데이트와 기업용 AI 도입 사례가 가장 많이 다뤄지고 있어.";
  }
  if (prompt.includes("관리자") || prompt.includes("점검")) {
    return "매일 결제 대기 주문의 만료 여부, 실패 주문의 보상 상태, 진행 중인 드롭의 잔여 재고를 순서대로 확인하면 좋아.";
  }
  if (prompt.includes("엑셀")) {
    return "엑셀은 표 형식으로 데이터를 입력하고 계산·분석·시각화할 수 있는 스프레드시트 프로그램이야.";
  }
  return "질문을 확인했어. 알고 싶은 대상을 조금 더 구체적으로 적어주면 자연스럽게 정리해 줄게.";
}

function requiresTool(prompt: string): boolean {
  return /주문|결제|환불|정산|수수료|회원|상품|드롭|사가|보상|적체|날씨|뉴스|검색|관리자|점검/.test(
    prompt,
  );
}

function responseEvents(prompt: string): string[] {
  const requestId = uuid();
  const answer = answerFor(prompt);
  const midpoint = Math.max(1, Math.floor(answer.length / 2));
  const stages: ChatStage[] = requiresTool(prompt)
    ? ["ANALYZING", "CALLING_TOOL", "GENERATING"]
    : ["ANALYZING", "GENERATING"];

  return [
    sse("started", { requestId }),
    ...stages.map((stage) => sse("status", { requestId, stage })),
    sse("delta", { requestId, text: answer.slice(0, midpoint) }),
    sse("delta", { requestId, text: answer.slice(midpoint) }),
    sse("done", { requestId }),
  ];
}

function streamResponse(prompt: string): Response {
  const chunks = responseEvents(prompt);
  let index = 0;
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      await new Promise((resolve) => setTimeout(resolve, index === 0 ? 60 : 90));
      if (cancelled) {
        return;
      }
      const chunk = chunks[index];
      if (chunk === undefined) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunk));
      index += 1;
    },
    cancel() {
      cancelled = true;
    },
  });

  return new HttpResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export const chatHandlers = [
  http.get("*/api/v1/ai/chats/capabilities", () => HttpResponse.json(chatCapabilities)),
  http.post("*/api/v1/ai/chats", async ({ request }) => {
    const parsed = chatRequestSchema.safeParse(await request.json());
    if (!parsed.success || parsed.data.message.length > chatCapabilities.maxMessageLength) {
      return HttpResponse.json(
        { error: "INVALID_CHAT_REQUEST", message: "질문 내용을 확인해 줘." },
        { status: 400 },
      );
    }
    return streamResponse(parsed.data.message);
  }),
];
