import { z } from "zod";

export const DEFAULT_CHAT_MESSAGE_MAX_LENGTH = 2_000;
export const CHAT_PREVIOUS_QUESTION_MAX_LENGTH = 300;
export const CHAT_PREVIOUS_ANSWER_MAX_LENGTH = 800;

export const chatCapabilityTypeSchema = z.enum([
  "ORDER",
  "PAYMENT_REFUND",
  "SETTLEMENT",
  "MEMBER",
  "PRODUCT_DROP",
  "RELIABILITY",
  "OPERATIONS",
  "WEATHER",
  "WEB_SEARCH",
  "GENERAL",
]);
export type ChatCapabilityType = z.infer<typeof chatCapabilityTypeSchema>;

export const chatCapabilityAvailabilitySchema = z.enum(["ACTIVE", "PLANNED", "UNAVAILABLE"]);
export type ChatCapabilityAvailability = z.infer<typeof chatCapabilityAvailabilitySchema>;

export const chatCapabilitySchema = z
  .object({
    type: chatCapabilityTypeSchema,
    label: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(300),
    availability: chatCapabilityAvailabilitySchema,
    sampleQuestions: z.array(z.string().trim().min(1).max(DEFAULT_CHAT_MESSAGE_MAX_LENGTH)).max(10),
  })
  .strict();
export type ChatCapability = z.infer<typeof chatCapabilitySchema>;

export const chatCapabilitiesResponseSchema = z
  .object({
    prototype: z.boolean(),
    maxMessageLength: z.number().int().positive().max(10_000),
    notice: z.string().trim().min(1).max(500),
    capabilities: z.array(chatCapabilitySchema).max(20),
  })
  .strict();
export type ChatCapabilitiesResponse = z.infer<typeof chatCapabilitiesResponseSchema>;

export const chatPreviousTurnSchema = z
  .object({
    question: z.string().trim().min(1).max(CHAT_PREVIOUS_QUESTION_MAX_LENGTH),
    answer: z.string().trim().min(1).max(CHAT_PREVIOUS_ANSWER_MAX_LENGTH),
  })
  .strict();
export type ChatPreviousTurn = z.infer<typeof chatPreviousTurnSchema>;

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(DEFAULT_CHAT_MESSAGE_MAX_LENGTH),
    previousTurn: chatPreviousTurnSchema.optional(),
  })
  .strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatStageSchema = z.enum(["ANALYZING", "CALLING_TOOL", "GENERATING"]);
export type ChatStage = z.infer<typeof chatStageSchema>;

const requestIdSchema = z.string().uuid();
const eventCodeSchema = z.string().trim().min(1).max(120);

const chatStartedPayloadSchema = z.object({ requestId: requestIdSchema }).strict();
const chatStatusPayloadSchema = z
  .object({ requestId: requestIdSchema, stage: chatStageSchema })
  .strict();
const chatDeltaPayloadSchema = z
  .object({
    requestId: requestIdSchema,
    text: z.string().min(1).max(20_000),
  })
  .strict();
const chatDonePayloadSchema = z.object({ requestId: requestIdSchema }).strict();
export const chatErrorPayloadSchema = z
  .object({
    requestId: requestIdSchema,
    code: eventCodeSchema,
    message: z.string().trim().min(1).max(1_000),
    retryable: z.boolean(),
    partial: z.boolean(),
  })
  .strict();
export type ChatErrorPayload = z.infer<typeof chatErrorPayloadSchema>;

export type ChatStreamEvent =
  | { type: "started"; data: z.infer<typeof chatStartedPayloadSchema> }
  | { type: "status"; data: z.infer<typeof chatStatusPayloadSchema> }
  | { type: "delta"; data: z.infer<typeof chatDeltaPayloadSchema> }
  | { type: "done"; data: z.infer<typeof chatDonePayloadSchema> }
  | { type: "error"; data: ChatErrorPayload };

export function parseChatStreamEvent(type: string, value: unknown): ChatStreamEvent {
  switch (type) {
    case "started":
      return { type, data: chatStartedPayloadSchema.parse(value) };
    case "status":
      return { type, data: chatStatusPayloadSchema.parse(value) };
    case "delta":
      return { type, data: chatDeltaPayloadSchema.parse(value) };
    case "done":
      return { type, data: chatDonePayloadSchema.parse(value) };
    case "error":
      return { type, data: chatErrorPayloadSchema.parse(value) };
    default:
      throw new Error(`지원하지 않는 SSE 이벤트입니다: ${type}`);
  }
}
