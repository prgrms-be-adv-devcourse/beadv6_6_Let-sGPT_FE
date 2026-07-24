import type { ChatCapabilitiesResponse } from "@/features/chat/model/chat.schema";

export const chatCapabilities: ChatCapabilitiesResponse = {
  prototype: false,
  maxMessageLength: 2_000,
  notice: "운영과 관리에 필요한 내용을 편하게 물어봐.",
  capabilities: [
    {
      type: "ORDER",
      label: "주문·판매",
      description:
        "주문 건수·수량·금액·실패율·상품 순위와 공개 주문번호 한 건의 처리 흐름을 조회해.",
      availability: "ACTIVE",
      sampleQuestions: ["지난달 주문금액과 주별 추이를 알려줘", "가장 많이 팔린 상품은?"],
    },
    {
      type: "PAYMENT_REFUND",
      label: "결제·환불",
      description: "결제 승인·실패·금액과 환불 현황을 안전한 집계로 조회해.",
      availability: "ACTIVE",
      sampleQuestions: ["지난주 결제 성공률과 환불액은?"],
    },
    {
      type: "SETTLEMENT",
      label: "정산·대사",
      description: "수수료·환불·조정·최종 지급액과 배치·대사 현황을 집계해.",
      availability: "ACTIVE",
      sampleQuestions: ["지난달 최종 정산액과 수수료를 알려줘"],
    },
    {
      type: "MEMBER",
      label: "회원 집계",
      description: "개인정보 없이 현재·신규·탈퇴 회원 수를 집계해.",
      availability: "ACTIVE",
      sampleQuestions: ["이번 달 신규 가입과 탈퇴 추이를 알려줘"],
    },
    {
      type: "PRODUCT_DROP",
      label: "상품과 드롭",
      description: "상품 구성과 드롭 재고·소진 현황을 집계해.",
      availability: "ACTIVE",
      sampleQuestions: ["재고 소진율이 높은 상품을 알려줘"],
    },
    {
      type: "RELIABILITY",
      label: "처리 안정성",
      description: "주문 사가와 내부 이벤트 적체를 비식별 집계로 점검해.",
      availability: "ACTIVE",
      sampleQuestions: ["10분 넘게 보상 중인 주문 사가가 있어?"],
    },
    {
      type: "OPERATIONS",
      label: "운영 안내",
      description: "확인된 OPENAT 운영 문서로 점검 절차와 활용 방법을 안내해.",
      availability: "ACTIVE",
      sampleQuestions: ["관리자가 매일 뭘 확인하면 좋을까?"],
    },
    {
      type: "WEATHER",
      label: "날씨",
      description: "한국 지역의 오늘 또는 내일 예보를 조회해.",
      availability: "ACTIVE",
      sampleQuestions: ["오늘 부천 날씨는?"],
    },
    {
      type: "WEB_SEARCH",
      label: "웹 검색",
      description: "최신 뉴스와 현재 공개 정보를 찾아 자연어로 정리해.",
      availability: "ACTIVE",
      sampleQuestions: ["오늘 주요 AI 뉴스를 찾아줘"],
    },
    {
      type: "GENERAL",
      label: "일반 답변",
      description: "시점에 영향받지 않는 일반 지식을 바로 설명해.",
      availability: "ACTIVE",
      sampleQuestions: ["엑셀이 뭐야?"],
    },
  ],
};
