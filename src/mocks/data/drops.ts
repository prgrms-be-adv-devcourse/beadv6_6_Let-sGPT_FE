import type { DropCard, DropStatus } from "@/features/drop/model/drop.schema";
import { products } from "./products";

type DropSeed = {
  productIndex: number;
  status: DropStatus;
  dropPrice: number;
  total: number;
  remaining: number;
  openAt: string;
  closeAt: string | null;
};

const DROP_SEED: DropSeed[] = [
  {
    productIndex: 11,
    status: "OPEN",
    dropPrice: 219000,
    total: 100,
    remaining: 37,
    openAt: "2026-06-27T03:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 0,
    status: "OPEN",
    dropPrice: 139000,
    total: 50,
    remaining: 8,
    openAt: "2026-06-26T10:00:00Z",
    closeAt: "2026-07-03T10:00:00Z",
  },
  {
    productIndex: 12,
    status: "OPEN",
    dropPrice: 59000,
    total: 200,
    remaining: 152,
    openAt: "2026-06-25T00:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 1,
    status: "OPEN",
    dropPrice: 89000,
    total: 150,
    remaining: 64,
    openAt: "2026-06-24T00:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 4,
    status: "REGISTERED",
    dropPrice: 129000,
    total: 80,
    remaining: 80,
    openAt: "2026-07-01T00:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 15,
    status: "REGISTERED",
    dropPrice: 329000,
    total: 60,
    remaining: 60,
    openAt: "2026-07-05T06:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 3,
    status: "REGISTERED",
    dropPrice: 159000,
    total: 120,
    remaining: 120,
    openAt: "2026-07-10T00:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 6,
    status: "CLOSE",
    dropPrice: 49000,
    total: 300,
    remaining: 0,
    openAt: "2026-06-10T00:00:00Z",
    closeAt: "2026-06-17T00:00:00Z",
  },
  {
    productIndex: 5,
    status: "SOLD_OUT",
    dropPrice: 39000,
    total: 60,
    remaining: 0,
    openAt: "2026-06-12T00:00:00Z",
    closeAt: null,
  },
  {
    productIndex: 8,
    status: "SOLD_OUT",
    dropPrice: 24000,
    total: 90,
    remaining: 0,
    openAt: "2026-06-08T00:00:00Z",
    closeAt: null,
  },
];

export const drops: DropCard[] = DROP_SEED.map((seed, index) => {
  const product = products[seed.productIndex] ?? products[0];
  return {
    id: `d${index + 1}`,
    productId: product?.id ?? `p${seed.productIndex + 1}`,
    productName: product?.name ?? "상품",
    sellerName: product?.sellerName ?? null,
    categoryId: product?.categoryId ?? null,
    categoryName: product?.categoryName ?? null,
    thumbnailKey: product?.thumbnailKey ?? null,
    dropPrice: seed.dropPrice,
    totalQuantity: seed.total,
    remainingQuantity: seed.remaining,
    status: seed.status,
    openAt: seed.openAt,
    closeAt: seed.closeAt,
  };
});

export function findDrop(id: string): DropCard | undefined {
  return drops.find((drop) => drop.id === id);
}
