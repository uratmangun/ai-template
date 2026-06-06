export type ProxyModel = {
  id?: string;
  owned_by?: string;
};

export type ProxyModelsResponse = {
  data?: ProxyModel[];
};

export type UiModel = {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
};

function inferProviderLogo(modelId: string, ownedBy?: string) {
  const owner = ownedBy?.toLowerCase() ?? "";
  const id = modelId.toLowerCase();

  if (owner.includes("openai") || id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("codex-")) {
    return "openai";
  }

  if (owner.includes("anthropic") || id.includes("claude")) {
    return "anthropic";
  }

  if (owner.includes("google") || id.includes("gemini")) {
    return "google";
  }

  if (owner.includes("kilo") || owner.includes("openrouter") || id.startsWith("kilo-") || id.startsWith("openrouter/")) {
    return "openrouter";
  }

  if (id.includes("qwen")) {
    return "alibaba";
  }

  if (id.includes("llama")) {
    return "llama";
  }

  if (id.includes("mistral")) {
    return "mistral";
  }

  if (id.includes("deepseek")) {
    return "deepseek";
  }

  if (id.includes("grok")) {
    return "xai";
  }

  return "openai";
}

function inferProviderLabel(modelId: string, ownedBy?: string) {
  if (ownedBy?.trim()) {
    return ownedBy.trim();
  }

  const id = modelId.toLowerCase();

  if (id.startsWith("kilo-") || id.startsWith("openrouter/")) {
    return "OpenRouter";
  }

  if (id.includes("gemini")) {
    return "Google";
  }

  if (id.includes("claude")) {
    return "Anthropic";
  }

  if (id.includes("qwen")) {
    return "Alibaba";
  }

  return "OpenAI-compatible";
}

export function normalizeModel(model: ProxyModel): UiModel | null {
  const id = model.id?.trim();

  if (!id) {
    return null;
  }

  const owner = model.owned_by?.trim();

  return {
    id,
    name: id,
    provider: inferProviderLogo(id, owner),
    providerLabel: inferProviderLabel(id, owner),
  };
}
