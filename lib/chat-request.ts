import type { ProviderSettings } from "@/lib/provider-settings";
import { DEFAULT_MODEL } from "@/lib/repo-system-prompt";

/** Per-request body for /api/chat — avoids stale values from useChat transport. */
export function buildChatRequestBody(settings: ProviderSettings) {
  return {
    baseURL: settings.baseURL,
    apiKey: settings.apiKey,
    model: settings.model.trim() || DEFAULT_MODEL,
    systemPrompt: settings.systemPrompt,
  };
}
