import { HttpResponse, http } from "msw";

import { chatRequestSchema } from "@/features/chat/model/chat.schema";
import { chatCapabilities } from "../data/chat";

const encoder = new TextEncoder();

const SENSITIVE_VALUE_PATTERNS = [
  /[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /(?<!\d)01[016789][- ]?\d{3,4}[- ]?\d{4}(?!\d)/,
  /(?<!\d)\d{6}-[1-4]\d{6}(?!\d)/,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/,
  /\beyj[a-z0-9_-]{5,}\.[a-z0-9_-]{5,}\.[a-z0-9_-]{5,}\b/i,
  /\bbearer\s+[a-z0-9._~+/=-]{8,}/i,
  /(?:api[ _-]?(?:key|키)|password|secret|token|비밀번호|비밀[ _-]?키)\s*(?::|=|은|는|이|가)\s*["']?[a-z0-9._~+/=!@#$%^&*()-]{4,}/i,
];
const PII_TOPIC =
  /(개인[ ]*정보|(?:집[ ]*)?주소|생년월일|이메일(?:[ ]*주소)?|메일[ ]*주소|전화번호|휴대폰(?:[ ]*번호)?|연락처|주민(?:등록)?번호|계좌(?:[ ]*번호)?|신용[ ]*카드(?:[ ]*번호)?|사업자(?:등록)?번호|비밀번호|api[ _-]?(?:key|키)|access[ _-]?token|refresh[ _-]?token)/i;
const PII_LOOKUP_INTENT =
  /(알려|보여|조회|찾아|검색|목록|리스트|추출|가져|내놔|확인|열람|공개|출력|다운로드|뭐|무엇|어디)/;
const INTERNAL_CONTEXT =
  /(openat|open[ ]+at|오픈앳|사내|내부(?:[ ]*(?:문서|데이터|정책|시스템))?|관리자[ ]*(?:데이터|화면|업무)|데이터베이스|db[ ]*(?:조회|테이블|스키마))/i;
const INTERNAL_BUSINESS_TOPIC =
  /(dau|wau|mau|arpu|arppu|gmv|가입자|활성[ ]*사용자|신규[ ]*회원|주문|결제|정산|대사|매출|재고|회원|고객|판매자|환불|상품|드롭|구매)/i;
const INTERNAL_METRIC_EXPRESSION =
  /(dau|wau|mau|arpu|arppu|gmv|가입자[ ]*수|주문[ ]*(?:수|건수)|결제[ ]*(?:수|건수|금액)|매출(?:액)?|재고[ ]*(?:수량|현황))/i;
const INTERNAL_DATA_INTENT =
  /(오늘|지금|현재|최신|최근|이번[ ]*(?:주|달|분기|해|연도)|지표|통계|현황|추이|분포|목록|내역|결과|정보|데이터|상태|건수|개수|수량|금액|총액|평균|합계|비율|상태별|일별|주별|월별|몇[ ]*(?:건|명|개)|얼마|조회|보여|알려|집계|계산)/;
const INTERNAL_POLICY_TOPIC =
  /(?:(?:주문|결제|정산|환불|취소|재고|관리자|운영).{0,12}(?:정책|절차|프로세스|업무|규정|지침|매뉴얼)|(?:정책|절차|프로세스|업무|규정|지침|매뉴얼).{0,12}(?:주문|결제|정산|환불|취소|재고|관리자|운영))/i;
const REALTIME_TOPIC = /(날씨|환율|공휴일|뉴스|주가|코인|미세먼지|교통|시각)/;
const REALTIME_MARKER =
  /(오늘|지금|현재|최신|실시간|요즘|최근|어제|내일|이번[ ]*(?:주|달|분기|해|연도))/;
const LOOKUP_INTENT =
  /(알려|보여|조회|찾아|검색|확인|요약|추천|누구|뭐|무엇|몇|어디|언제|얼마|어때)/;
const GENERAL_EXPLANATION_INTENT =
  /(개념|뜻|의미|원리|차이|일반적으로|예시|정의|무엇인지|뭔지|뭐야|설명)/;
const GENERAL_WRITING_INTENT =
  /(글|문장|문구|안내문|공지문|초안|메일|시).{0,20}(작성|써|다듬|교정|번역)/;
const SIMPLE_GREETING = /^(안녕(?:하세요)?|반가워|고마워|감사해)(?:[?.!]|요)?$/;
const ACTION_REQUEST =
  /(보내|전송|발송|게시|공지|올려|등록|추가|수정|삭제|차단|취소|환불|승인|확정|실행|처리|예약|업로드|배포)(?:해|하여)?[ ]*(?:줘|주세요|라|하세요)(?:[?.!]|$)/;
const ACTION_COMMAND =
  /(슬랙|slack|이메일|메일|문자|sms|캘린더|노션|notion|팀즈|teams|주문|결제|환불|재고|사용자|회원).{0,30}(전송|발송|게시|등록|추가|수정|삭제|차단|취소|환불|승인|확정|실행|처리|예약|업로드|배포)(?:[.!]|$)/i;
const FOLLOW_UP_REFERENCE =
  /^(그거|이거|저거|그게|이게|저게|위[ ]*내용|앞[ ]*내용|계속|더[ ]*자세히)(?:[ ]|$)/;

type MockRouteDecision =
  | { route: "GENERAL_ANSWER"; message: null }
  | { route: "CLARIFICATION" | "UNSUPPORTED"; message: string };

function classify(message: string): MockRouteDecision {
  const normalized = message.trim().toLocaleLowerCase("ko-KR");

  if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      route: "UNSUPPORTED",
      message:
        "개인정보나 식별값이 포함된 질문은 아직 처리하지 않아요. 민감한 값을 제거하고 일반적인 형태로 질문해 주세요.",
    };
  }
  const piiTopic = PII_TOPIC.exec(normalized);
  const genericPiiExplanation =
    piiTopic?.index === 0 && GENERAL_EXPLANATION_INTENT.test(normalized);
  if (
    piiTopic &&
    !genericPiiExplanation &&
    (PII_LOOKUP_INTENT.test(normalized) || normalized.endsWith("?"))
  ) {
    return {
      route: "UNSUPPORTED",
      message:
        "개인정보나 비밀 값을 조회하는 질문은 아직 처리하지 않아요. 민감정보가 필요 없는 일반적인 형태로 질문해 주세요.",
    };
  }
  if (ACTION_REQUEST.test(normalized) || ACTION_COMMAND.test(normalized)) {
    return {
      route: "UNSUPPORTED",
      message:
        "업무를 대신 실행하는 기능은 아직 제공하지 않아요. 현재는 설명과 글쓰기 요청만 도와드릴 수 있어요.",
    };
  }
  const generalExplanation = GENERAL_EXPLANATION_INTENT.test(normalized);
  const internalQuestion =
    INTERNAL_CONTEXT.test(normalized) ||
    INTERNAL_POLICY_TOPIC.test(normalized) ||
    (INTERNAL_BUSINESS_TOPIC.test(normalized) &&
      (INTERNAL_METRIC_EXPRESSION.test(normalized) || INTERNAL_DATA_INTENT.test(normalized)) &&
      !generalExplanation);
  if (internalQuestion) {
    return {
      route: "UNSUPPORTED",
      message:
        "관리자 데이터와 내부 정책 조회는 아직 연결하지 않았어요. 현재는 사내 데이터가 필요 없는 일반 설명과 글쓰기만 도와드릴 수 있어요.",
    };
  }
  const realtimeTopic = REALTIME_TOPIC.test(normalized);
  const realtimeMarker = REALTIME_MARKER.test(normalized);
  const asksForCurrentValue = LOOKUP_INTENT.test(normalized) || normalized.endsWith("?");
  const generalWriting = GENERAL_WRITING_INTENT.test(normalized);
  const realtimeQuestion =
    (realtimeTopic && realtimeMarker && !generalExplanation) ||
    (realtimeMarker && asksForCurrentValue && !generalWriting) ||
    (realtimeTopic && asksForCurrentValue && !generalExplanation);
  if (realtimeQuestion) {
    return {
      route: "UNSUPPORTED",
      message:
        "실시간 정보 도구는 아직 연결하지 않았어요. 날씨·환율처럼 최신 값이 필요한 질문은 다음 단계에서 제공할 예정이에요.",
    };
  }
  if (FOLLOW_UP_REFERENCE.test(normalized)) {
    return {
      route: "CLARIFICATION",
      message:
        "현재는 질문마다 독립적으로 처리하고 있어요. 설명할 대상이나 원하는 결과를 이번 질문에 함께 적어 주세요.",
    };
  }
  if (generalExplanation || generalWriting || SIMPLE_GREETING.test(normalized)) {
    return { route: "GENERAL_ANSWER", message: null };
  }
  return {
    route: "UNSUPPORTED",
    message:
      "현재는 일반 개념 설명과 글쓰기 요청만 처리해요. 사내 데이터나 최신 정보가 필요 없는 형태로 대상을 분명히 적어 주세요.",
  };
}

function sse(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

function answerFor(message: string): string {
  if (message.includes("피벗")) {
    return [
      "피벗 테이블은 많은 표 데이터를 원하는 기준으로 빠르게 묶어 요약하는 기능입니다.",
      "행에는 비교할 항목을, 열에는 나눠 볼 기준을, 값에는 합계나 개수를 넣습니다. 예를 들어 주문 데이터에서 행을 ‘상품’, 열을 ‘월’, 값을 ‘주문 금액 합계’로 두면 상품별 월 매출을 한눈에 볼 수 있습니다.",
      "원본 표를 직접 고치지 않고 배치만 바꿔 여러 관점으로 살펴볼 수 있다는 점이 가장 큰 장점입니다.",
    ].join("\n\n");
  }
  if (message.includes("일정") || message.includes("안내문")) {
    return "안녕하세요. 예정된 회의 일정이 변경되어 안내드립니다. 변경된 일시를 확인해 주시고, 참석이 어려운 경우 미리 알려주세요. 감사합니다.";
  }
  if (message.includes("API") || message.includes("SDK")) {
    return "API는 두 프로그램이 서로 요청과 응답을 주고받는 약속입니다. SDK는 그 API를 더 쉽게 사용할 수 있도록 코드, 도구, 예제를 묶어 제공하는 개발 도구 모음입니다.";
  }
  return "복잡한 업무는 목적, 준비 사항, 실행 순서, 완료 기준의 네 부분으로 나누면 확인하기 쉽습니다. 각 단계는 한 문장에 하나의 행동만 담고, 담당자와 마감 시점을 함께 적어 실제 업무에서 바로 쓸 수 있게 정리해 보세요.";
}

function streamResponse(message: string): Response {
  const decision = classify(message);
  const chunks = [sse("status", { stage: "ROUTING", route: null }), ": heartbeat\n\n"];

  if (decision.route === "GENERAL_ANSWER") {
    chunks.push(
      sse("status", { stage: "GENERATING", route: "GENERAL_ANSWER" }),
      sse("delta", { text: answerFor(message) }),
      sse("done", { route: "GENERAL_ANSWER" }),
    );
  } else {
    chunks.push(
      sse("message", { text: decision.message, candidates: [] }),
      sse("done", { route: decision.route }),
    );
  }
  let index = 0;
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      await new Promise((resolve) => setTimeout(resolve, index === 0 ? 80 : 45));
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
        { error: "INVALID_CHAT_REQUEST", message: "질문 내용을 확인해 주세요." },
        { status: 400 },
      );
    }
    return streamResponse(parsed.data.message);
  }),
];
