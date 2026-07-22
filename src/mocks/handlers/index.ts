import { categoryHandlers } from "./category.handlers";
import { chatHandlers } from "./chat.handlers";
import { dropHandlers } from "./drop.handlers";
import { memberHandlers } from "./member.handlers";
import { orderHandlers } from "./order.handlers";
import { paymentHandlers } from "./payment.handlers";
import { productHandlers } from "./product.handlers";
import { queueHandlers } from "./queue.handlers";
import { sellerHandlers } from "./seller.handlers";
import { settlementHandlers } from "./settlement.handlers";

export const handlers = [
  ...chatHandlers,
  ...productHandlers,
  ...dropHandlers,
  ...categoryHandlers,
  ...memberHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...settlementHandlers,
  ...queueHandlers,
];
