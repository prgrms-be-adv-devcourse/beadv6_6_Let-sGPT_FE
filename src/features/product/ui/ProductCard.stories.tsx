import type { Meta, StoryObj } from "@storybook/react-vite";

import type { Product } from "../model/product.schema";
import { ProductCard } from "./ProductCard";

const baseProduct: Product = {
  id: "p1",
  sellerId: "s1",
  name: "한정판 러너 SS26",
  description: "",
  categoryId: "c1",
  categoryName: "스니커즈",
  price: 219000,
  thumbnailKey: null,
  createdAt: "2026-06-01T00:00:00Z",
};

const meta = {
  title: "product/ProductCard",
  component: ProductCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { product: baseProduct },
};

export const NoPrice: Story = {
  args: { product: { ...baseProduct, name: "가격 미정 상품", price: null } },
};
