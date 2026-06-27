import type { Meta, StoryObj } from "@storybook/react-vite";

import type { DropCard as DropCardModel } from "../model/drop.schema";
import { DropCard } from "./DropCard";

const baseDrop: DropCardModel = {
  id: "d1",
  productId: "p1",
  productName: "한정판 러너 SS26",
  thumbnailKey: null,
  dropPrice: 219000,
  totalQuantity: 100,
  remainingQuantity: 37,
  status: "OPEN",
  openAt: "2026-07-01T00:00:00Z",
  closeAt: null,
};

const meta = {
  title: "drop/DropCard",
  component: DropCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ongoing: Story = {
  args: { drop: baseDrop },
};

export const Upcoming: Story = {
  args: { drop: { ...baseDrop, status: "REGISTERED", remainingQuantity: 100 } },
};

export const SoldOut: Story = {
  args: { drop: { ...baseDrop, status: "SOLD_OUT", remainingQuantity: 0 } },
};
