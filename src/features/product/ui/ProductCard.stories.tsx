import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductCard } from "./ProductCard";

const meta = {
  title: "product/ProductCard",
  component: ProductCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: { id: "p1", name: "샘플 상품", priceAmount: 29000 },
  },
};

export const LongName: Story = {
  args: {
    product: {
      id: "p2",
      name: "아주 긴 상품명을 가진 한정판 드롭 상품 에디션",
      priceAmount: 189000,
    },
  },
};
