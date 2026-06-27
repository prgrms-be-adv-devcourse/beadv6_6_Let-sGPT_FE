import { categoryHandlers } from "./category.handlers";
import { dropHandlers } from "./drop.handlers";
import { memberHandlers } from "./member.handlers";
import { productHandlers } from "./product.handlers";

export const handlers = [
  ...productHandlers,
  ...dropHandlers,
  ...categoryHandlers,
  ...memberHandlers,
];
