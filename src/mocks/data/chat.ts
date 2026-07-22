import type { ChatCapabilitiesResponse } from "@/features/chat/model/chat.schema";

export const chatCapabilities: ChatCapabilitiesResponse = {
  prototype: true,
  maxMessageLength: 2_000,
  notice: "일반 개념 설명과 글쓰기를 지원하며, 각 질문은 독립적으로 처리해요.",
  capabilities: [
    {
      type: "GENERAL_ANSWER",
      label: "일반 질문",
      description: "사내 데이터나 최신 정보가 필요 없는 설명과 글쓰기를 도와드려요.",
      availability: "ACTIVE",
      sampleQuestions: [
        "엑셀 피벗 테이블을 쉽게 설명해줘",
        "회의 일정 변경 안내문을 간결하게 작성해줘",
        "API와 SDK의 차이를 비개발자에게 설명해줘",
      ],
    },
    {
      type: "FAST_METRIC",
      label: "고정 지표",
      description: "검증된 SQL로 정산·대사 같은 주요 지표를 조회할 예정이에요.",
      availability: "PLANNED",
      sampleQuestions: [],
    },
    {
      type: "SEMANTIC_QUERY",
      label: "자유 집계",
      description: "허용된 QueryPlan으로 기간·상태별 데이터를 집계할 예정이에요.",
      availability: "PLANNED",
      sampleQuestions: [],
    },
    {
      type: "KNOWLEDGE_RAG",
      label: "내부 문서",
      description: "권한이 있는 운영 정책과 업무 절차를 출처와 함께 안내할 예정이에요.",
      availability: "PLANNED",
      sampleQuestions: [],
    },
    {
      type: "EXTERNAL_TOOL",
      label: "실시간 정보",
      description: "승인된 도구로 날씨와 환율 같은 최신 정보를 확인할 예정이에요.",
      availability: "PLANNED",
      sampleQuestions: [],
    },
  ],
};
