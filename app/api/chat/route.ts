import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { DEFAULT_MODEL, REPO_SYSTEM_PROMPT } from "@/lib/repo-system-prompt";
import { validateProviderBaseUrl } from "@/lib/provider-url";

const requestSchema = z.object({
  messages: z.array(z.unknown()).default([]),
  model: z.string().trim().default(DEFAULT_MODEL),
  baseURL: z.string().trim().default(""),
  apiKey: z.string().trim().optional(),
  systemPrompt: z.string().optional(),
});

function toValidationResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);

  if (!parsed.success) {
    return toValidationResponse("Invalid chat request payload.");
  }

  const { messages, model, baseURL, apiKey, systemPrompt } = parsed.data;

  const validatedBaseUrl = validateProviderBaseUrl(baseURL);

  if (!validatedBaseUrl.ok) {
    return toValidationResponse(validatedBaseUrl.error);
  }

  const validatedMessages = await validateUIMessages<UIMessage>({ messages }).catch(() => null);

  if (!validatedMessages || validatedMessages.length === 0) {
    return toValidationResponse("Add a message before sending a chat request.");
  }

  const modelMessages = await convertToModelMessages(
    validatedMessages.map((message) => ({
      ...message,
      id: undefined,
    })),
  ).catch(() => null);

  if (!modelMessages || modelMessages.length === 0) {
    return toValidationResponse("Could not convert chat messages to model input.");
  }

  const provider = createOpenAICompatible({
    name: "template-provider",
    baseURL: validatedBaseUrl.normalizedUrl,
    apiKey: apiKey?.trim() || undefined,
  });

  const resolvedSystemPrompt = systemPrompt?.trim() || REPO_SYSTEM_PROMPT;

  const result = streamText({
    model: provider.chatModel(model || DEFAULT_MODEL),
    system: resolvedSystemPrompt,
    messages: modelMessages,
    abortSignal: request.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    sendStart: true,
    sendFinish: true,
  });
}
