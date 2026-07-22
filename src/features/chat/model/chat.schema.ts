import { z } from "zod";

export const DEFAULT_CHAT_MESSAGE_MAX_LENGTH = 2_000;

export const chatRouteSchema = z.enum([
  "FAST_METRIC",
  "SEMANTIC_QUERY",
  "KNOWLEDGE_RAG",
  "EXTERNAL_TOOL",
  "GENERAL_ANSWER",
  "CLARIFICATION",
  "UNSUPPORTED",
]);
export type ChatRoute = z.infer<typeof chatRouteSchema>;

export const chatCapabilityAvailabilitySchema = z.enum(["ACTIVE", "PLANNED", "UNAVAILABLE"]);
export type ChatCapabilityAvailability = z.infer<typeof chatCapabilityAvailabilitySchema>;

export const chatCapabilitySchema = z.object({
  type: chatRouteSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  availability: chatCapabilityAvailabilitySchema,
  sampleQuestions: z.array(z.string().trim().min(1)),
});
export type ChatCapability = z.infer<typeof chatCapabilitySchema>;

export const chatCapabilitiesResponseSchema = z.object({
  prototype: z.boolean(),
  maxMessageLength: z.number().int().positive(),
  notice: z.string().min(1),
  capabilities: z.array(chatCapabilitySchema),
});
export type ChatCapabilitiesResponse = z.infer<typeof chatCapabilitiesResponseSchema>;

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatStageSchema = z.enum([
  "ROUTING",
  "PLANNING",
  "QUERYING",
  "RETRIEVING",
  "CALLING_TOOL",
  "GENERATING",
]);
export type ChatStage = z.infer<typeof chatStageSchema>;

const chatStatusPayloadSchema = z.object({
  stage: chatStageSchema,
  route: chatRouteSchema.nullish(),
});
const chatMessagePayloadSchema = z.object({ text: z.string().min(1) });
const chatDeltaPayloadSchema = z.object({ text: z.string() });
const chatDonePayloadSchema = z.object({ route: chatRouteSchema });
export const chatErrorPayloadSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
  partial: z.boolean(),
});
export type ChatErrorPayload = z.infer<typeof chatErrorPayloadSchema>;

export type ChatStreamEvent =
  | { type: "status"; data: z.infer<typeof chatStatusPayloadSchema> }
  | { type: "message"; data: z.infer<typeof chatMessagePayloadSchema> }
  | { type: "delta"; data: z.infer<typeof chatDeltaPayloadSchema> }
  | { type: "done"; data: z.infer<typeof chatDonePayloadSchema> }
  | { type: "error"; data: ChatErrorPayload };

export function parseChatStreamEvent(type: string, value: unknown): ChatStreamEvent {
  switch (type) {
    case "status":
      return { type, data: chatStatusPayloadSchema.parse(value) };
    case "message":
      return { type, data: chatMessagePayloadSchema.parse(value) };
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
