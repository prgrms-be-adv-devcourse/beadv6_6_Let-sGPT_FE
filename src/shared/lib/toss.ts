import { uuid } from "@/shared/lib/id";

interface TossPaymentRequest {
  method: "CARD" | "TRANSFER" | "VIRTUAL_ACCOUNT" | "MOBILE_PHONE";
  amount: { currency: "KRW"; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  card?: {
    useEscrow?: boolean;
    flowMode?: string;
    useCardPoint?: boolean;
    useAppCardOnly?: boolean;
  };
}

interface TossPaymentHandle {
  requestPayment(options: TossPaymentRequest): Promise<void>;
}

interface TossPaymentsInstance {
  payment(options: { customerKey: string }): TossPaymentHandle;
}

declare global {
  function TossPayments(clientKey: string): TossPaymentsInstance;
}

export function createTossPayment(): TossPaymentHandle {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
  const customerKey = uuid();
  return TossPayments(clientKey).payment({ customerKey });
}
