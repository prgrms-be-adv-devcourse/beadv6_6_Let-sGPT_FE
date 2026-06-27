import type { Product } from "@/features/product/model/product.schema";
import { categories } from "./categories";

export const SELLER_ID = "11111111-1111-1111-1111-111111111111";

/** 표시용 판매자(스토어)명 목 — BE 미제공이라 카탈로그 다양성을 위해 라운드로빈 배정. */
export const SELLER_NAMES = [
  "오픈앳 스튜디오",
  "노드 아틀리에",
  "메짐 워크룸",
  "팩토리5",
  "아워레어",
] as const;

/** 신규 등록 상품의 기본 판매자명(판매자 콘솔에서 생성 시). */
export const DEFAULT_SELLER_NAME = SELLER_NAMES[0];

const PRODUCT_NAMES = [
  "오버사이즈 후디 차콜",
  "미니멀 크로스백",
  "잉크펜 세트 블랙",
  "와이어리스 이어버드",
  "아트토이 베어 화이트",
  "캔버스 토트백",
  "릴랙스 핏 스웨트팬츠",
  "시그니처 삭스 3팩",
  "그래픽 머그 세라믹",
  "메탈 키링 실버",
  "노트북 슬리브 13",
  "한정판 러너 SS26",
  "콜라보 캡 화이트",
  "스튜디오 노트 A5",
  "데스크 매트 우드",
  "피규어 컬렉터스 박스",
];

/** 목 상품(실제 이미지 thumbnailKey 포함). 가격 1건은 null(가격 미정). */
export const products: Product[] = PRODUCT_NAMES.map((name, index) => {
  const category = categories[index % categories.length] ?? categories[0];
  return {
    id: `p${index + 1}`,
    sellerId: SELLER_ID,
    sellerName: SELLER_NAMES[index % SELLER_NAMES.length],
    name,
    description: `${name} — 한정 수량으로 만나는 openAt 단독 상품. 소재와 마감에 집중한 시즌 에디션입니다.`,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    price: index === 7 ? null : 39000 + index * 12000,
    thumbnailKey: `https://picsum.photos/seed/openat-${index + 1}/640/800`,
    createdAt: `2026-06-${String(20 - (index % 18)).padStart(2, "0")}T09:00:00Z`,
  };
});

export function findProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
