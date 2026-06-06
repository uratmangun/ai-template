import { z } from "zod";

import { normalizeModel, type ProxyModelsResponse } from "@/lib/models";
import { validateProviderBaseUrl } from "@/lib/provider-url";

const requestSchema = z.object({
  baseURL: z.string().trim().default(""),
  apiKey: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      {
        configured: false,
        data: [],
        message: "Invalid model request payload.",
      },
      { status: 200 },
    );
  }

  const { baseURL, apiKey } = parsed.data;

  if (!baseURL) {
    return Response.json(
      {
        configured: false,
        data: [],
        message: "Open provider settings and add an OpenAI-compatible URL to load models.",
      },
      { status: 200 },
    );
  }

  const validatedBaseUrl = validateProviderBaseUrl(baseURL);

  if (!validatedBaseUrl.ok) {
    return Response.json(
      {
        configured: true,
        data: [],
        message: validatedBaseUrl.error,
      },
      { status: 200 },
    );
  }

  try {
    const response = await fetch(`${validatedBaseUrl.normalizedUrl}/models`, {
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Model fetch failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ProxyModelsResponse;
    const normalized = (payload.data ?? [])
      .map(normalizeModel)
      .filter((model): model is NonNullable<ReturnType<typeof normalizeModel>> => model !== null);

    return Response.json(
      {
        configured: true,
        data: normalized,
        message:
          normalized.length === 0
            ? "No models were returned by the configured OpenAI-compatible API."
            : null,
      },
      { status: 200 },
    );
  } catch {
    return Response.json(
      {
        configured: true,
        data: [],
        message: "Could not load models from the configured OpenAI-compatible API.",
      },
      { status: 200 },
    );
  }
}
