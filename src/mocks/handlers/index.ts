import { categoryHandlers } from "./category.handlers";
import { dropHandlers } from "./drop.handlers";
import { memberHandlers } from "./member.handlers";
import { orderHandlers } from "./order.handlers";
import { paymentHandlers } from "./payment.handlers";
import { productHandlers } from "./product.handlers";
import { sellerHandlers } from "./seller.handlers";
import { settlementHandlers } from "./settlement.handlers";

export const handlers = [
  ...productHandlers,
  ...dropHandlers,
  ...categoryHandlers,
  ...memberHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...settlementHandlers,
];
