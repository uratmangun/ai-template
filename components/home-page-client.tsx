"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  AlertCircleIcon,
  BotIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Settings2Icon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { buildChatRequestBody } from "@/lib/chat-request";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";
import { cn } from "@/lib/utils";
import type { UiModel } from "@/lib/models";
import {
  type ProviderSettings,
  useProviderSettings,
} from "@/lib/provider-settings";
import { DEFAULT_MODEL } from "@/lib/repo-system-prompt";

type ModelApiResponse = {
  configured: boolean;
  message: string | null;
  data: UiModel[];
};

const suggestedPrompts = [
  "Give me a quick tour of this template and what I should customize first.",
  "How do I clone this template into a private repository with gh CLI?",
  "Show me where to change the system prompt and deployment hostname.",
  "How do I deploy this Next.js app to my VPS with Podman and Cloudflare Tunnel?",
];

const SUGGESTED_PROMPT_BUTTON_CLASS =
  "h-auto justify-start whitespace-normal rounded-lg border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-3 text-left text-[13px] font-normal text-[#334155] transition-colors hover:border-black hover:bg-white hover:text-black";

function groupModelsByProvider(models: UiModel[]) {
  const groups = new Map<string, UiModel[]>();

  for (const model of models) {
    const existing = groups.get(model.providerLabel) ?? [];
    existing.push(model);
    groups.set(model.providerLabel, existing);
  }

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function ModelsBootstrap({
  settings,
  onBootstrap,
}: {
  settings: ProviderSettings;
  onBootstrap: (settings: ProviderSettings) => void | Promise<void>;
}) {
  useMountEffect(() => {
    void onBootstrap(settings);
  });

  return null;
}

export function HomePageClient() {
  const { settings, updateSettings } = useProviderSettings();
  const [draftSettings, setDraftSettings] = useState<ProviderSettings>(settings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [models, setModels] = useState<UiModel[]>([]);
  const [modelsMessage, setModelsMessage] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const providerConfigured = settings.baseURL.trim().length > 0;

  const modelOptions = useMemo(() => {
    const map = new Map<string, UiModel>();

    for (const model of models) {
      map.set(model.id, model);
    }

    if (settings.model && !map.has(settings.model)) {
      map.set(settings.model, {
        id: settings.model,
        name: settings.model,
        provider: "openai",
        providerLabel: "Custom",
      });
    }

    return Array.from(map.values()).sort((left, right) => left.id.localeCompare(right.id));
  }, [models, settings.model]);

  const modelGroups = useMemo(() => groupModelsByProvider(modelOptions), [modelOptions]);

  const selectedModel = useMemo(
    () => modelOptions.find((model) => model.id === settings.model),
    [modelOptions, settings.model],
  );

  const handleModelSelect = useCallback(
    (modelId: string) => {
      updateSettings((prev) => ({
        ...prev,
        model: modelId,
      }));
      setChatKey((current) => current + 1);
      setModelSelectorOpen(false);
    },
    [updateSettings],
  );

  const loadModels = useCallback(
    async (nextSettings: ProviderSettings) => {
      if (!nextSettings.baseURL.trim()) {
        setModels([]);
        setModelsMessage("Set an OpenAI-compatible URL in settings to load models.");
        return;
      }

      setModelsLoading(true);

      try {
        const response = await fetch("/api/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            baseURL: nextSettings.baseURL,
            apiKey: nextSettings.apiKey,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ModelApiResponse;
        setModels(payload.data);
        setModelsMessage(payload.message ?? null);

        if (payload.data.length > 0 && !payload.data.some((model) => model.id === nextSettings.model)) {
          updateSettings((prev) => ({
            ...prev,
            model: payload.data[0]?.id ?? "",
          }));
        }
      } catch {
        setModels([]);
        setModelsMessage("Could not load models from the configured API.");
      } finally {
        setModelsLoading(false);
      }
    },
    [updateSettings],
  );

  // Transport body is fixed at first useChat render; pass dynamic settings per sendMessage.
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const chat = useChat({
    id: `template-chat-${chatKey}`,
    transport,
  });

  const handleSaveSettings = useCallback(() => {
    const nextModel = draftSettings.model.trim() || settings.model || DEFAULT_MODEL;

    const nextSettings: ProviderSettings = {
      baseURL: draftSettings.baseURL.trim(),
      apiKey: draftSettings.apiKey.trim(),
      model: nextModel,
      systemPrompt: draftSettings.systemPrompt,
    };

    updateSettings(nextSettings);
    setSettingsOpen(false);
    setChatKey((value) => value + 1);
  }, [draftSettings, settings.model, updateSettings]);

  const handleCopyCommand = useCallback(async () => {
    await navigator.clipboard.writeText(
      "gh repo create my-new-repo --template uratmangun/ai-ide-template --private --clone",
    );
    setCopied(true);

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  }, []);

  const handleStopChat = useCallback(() => {
    void chat.stop();
  }, [chat]);

  const handleDismissError = useCallback(() => {
    chat.clearError();
  }, [chat]);

  const handleSubmitPrompt = useCallback(
    ({ text }: { text: string }) => {
      if (chat.status === "submitted" || chat.status === "streaming") {
        handleStopChat();
        return;
      }

      const content = text.trim();

      if (!content) {
        return;
      }

      if (chat.status === "error") {
        handleDismissError();
      }

      void chat.sendMessage(
        {
          role: "user",
          parts: [
            {
              type: "text",
              text: content,
            },
          ],
        },
        { body: buildChatRequestBody(settings) },
      );
    },
    [chat, settings, handleStopChat, handleDismissError],
  );

  const isSending = chat.status === "submitted" || chat.status === "streaming";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-8 md:py-8">
      <ModelsBootstrap
        key={`${settings.baseURL}|${settings.apiKey}`}
        onBootstrap={loadModels}
        settings={settings}
      />

      <Card className="border-foreground/10 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <Badge variant="secondary">Next.js + AI SDK + Podman</Badge>
              <CardTitle className="text-2xl tracking-tight md:text-3xl">AI IDE Template</CardTitle>
              <CardDescription>
                Clone fast with GitHub CLI, then run this chat shell against any OpenAI-compatible endpoint.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopyCommand} variant="outline">
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? "Copied" : "Copy clone command"}
              </Button>
              <Button
                onClick={() => {
                  window.open("https://github.com/uratmangun/ai-ide-template", "_blank", "noopener,noreferrer");
                }}
              >
                <ExternalLinkIcon className="size-4" />
                Open repo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <code className="block rounded-md border border-foreground/10 bg-background/60 px-3 py-2 font-mono text-xs text-foreground/90 md:text-sm">
            gh repo create my-new-repo --template uratmangun/ai-ide-template --private --clone
          </code>
        </CardContent>
      </Card>

      <Card className="flex min-h-[68vh] flex-col border-foreground/10 bg-card/85 shadow-xl backdrop-blur">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BotIcon className="size-4 text-primary" />
              <CardTitle className="text-base">Repository assistant</CardTitle>
              {settings.model ? <Badge variant="outline">{settings.model}</Badge> : null}
            </div>
            <Button
              onClick={() => {
                setDraftSettings(settings);
                setSettingsOpen(true);
              }}
              size="sm"
              variant="outline"
            >
              <Settings2Icon className="size-4" />
              Provider settings
            </Button>
          </div>
          {modelsMessage ? (
            <Alert>
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Model source</AlertTitle>
              <AlertDescription>{modelsMessage}</AlertDescription>
            </Alert>
          ) : null}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className="relative h-[calc(100dvh-11rem)] min-h-[36rem] w-full shrink-0 overflow-hidden"
              data-testid="chat-conversation-shell"
            >
              <Conversation className="absolute inset-0 size-full">
                <ConversationContent className="gap-6">
                  {chat.messages.length === 0 ? (
                    <ConversationEmptyState
                      title="Ask about customizing this template"
                      description="Try one of the prompts below or write your own deployment question."
                      icon={<BotIcon className="size-5" />}
                    >
                      <div className="flex w-full max-w-lg flex-col gap-2">
                        {suggestedPrompts.map((prompt) => (
                          <Button
                            key={prompt}
                            type="button"
                            variant="outline"
                            className={SUGGESTED_PROMPT_BUTTON_CLASS}
                            onClick={() => {
                              void handleSubmitPrompt({ text: prompt });
                            }}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </ConversationEmptyState>
                  ) : null}

                  {chat.messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        {message.parts.flatMap((part) =>
                          part.type === "text"
                            ? [
                                <MessageResponse key={`${message.id}-text-${part.text}`}>
                                  {part.text}
                                </MessageResponse>,
                              ]
                            : [],
                        )}
                      </MessageContent>
                    </Message>
                  ))}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            <div className="shrink-0 border-t border-border/60 p-3 md:p-4">
            <PromptInput className="w-full" onSubmit={handleSubmitPrompt}>
              <PromptInputBody>
                <PromptInputTextarea disabled={isSending} placeholder="Ask about this template, deployment, or customization…" />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputButton
                    aria-expanded={modelSelectorOpen}
                    aria-haspopup="dialog"
                    className="min-w-48 max-w-full md:min-w-64"
                    disabled={modelsLoading}
                    onClick={() => {
                      if (!providerConfigured) {
                        setDraftSettings(settings);
                        setSettingsOpen(true);
                        return;
                      }

                      setModelSelectorOpen(true);
                    }}
                    type="button"
                  >
                    {modelsLoading ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />
                        <ModelSelectorName>Loading models</ModelSelectorName>
                      </>
                    ) : !providerConfigured ? (
                      <ModelSelectorName>Select model</ModelSelectorName>
                    ) : (
                      <>
                        {selectedModel ? (
                          <ModelSelectorLogo provider={selectedModel.provider} />
                        ) : null}
                        <ModelSelectorName>
                          {selectedModel?.id ?? (settings.model || "Select model")}
                        </ModelSelectorName>
                      </>
                    )}
                  </PromptInputButton>
                </PromptInputTools>
                <PromptInputSubmit
                  className={cn(
                    isSending &&
                      "bg-destructive text-white hover:bg-destructive/90 hover:text-white [&_svg]:text-white",
                    chat.status === "error" &&
                      "bg-destructive/90 text-white hover:bg-destructive hover:text-white [&_svg]:text-white",
                  )}
                  onErrorDismiss={handleDismissError}
                  onStop={handleStopChat}
                  status={chat.status}
                />
              </PromptInputFooter>
            </PromptInput>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
        <ModelSelectorContent title="Select model">
          <ModelSelectorInput placeholder="Search models..." />
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            {modelGroups.map(([providerLabel, providerModels]) => (
              <ModelSelectorGroup heading={providerLabel} key={providerLabel}>
                {providerModels.map((model) => (
                  <ModelSelectorItem
                    key={model.id}
                    onSelect={() => {
                      handleModelSelect(model.id);
                    }}
                    value={model.id}
                  >
                    <ModelSelectorLogo provider={model.provider} />
                    <ModelSelectorName>{model.id}</ModelSelectorName>
                    {settings.model === model.id ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : (
                      <span className="ml-auto size-4" />
                    )}
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            ))}
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>

      <Dialog onOpenChange={setSettingsOpen} open={settingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Provider settings</DialogTitle>
            <DialogDescription>
              Use a public OpenAI-compatible HTTPS API. Settings are stored locally in your browser.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="base-url">OpenAI-compatible base URL</FieldLabel>
              <FieldContent>
                <Input
                  id="base-url"
                  onChange={(event) => {
                    setDraftSettings((prev) => ({
                      ...prev,
                      baseURL: event.target.value,
                    }));
                  }}
                  placeholder="https://api.openai.com/v1"
                  value={draftSettings.baseURL}
                />
                <FieldDescription>
                  Must be a public HTTPS endpoint and should include the provider API version path.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="api-key">API key (optional)</FieldLabel>
              <FieldContent>
                <Input
                  id="api-key"
                  onChange={(event) => {
                    setDraftSettings((prev) => ({
                      ...prev,
                      apiKey: event.target.value,
                    }));
                  }}
                  placeholder="sk-..."
                  type="password"
                  value={draftSettings.apiKey}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="system-prompt">System prompt override</FieldLabel>
              <FieldContent>
                <Textarea
                  className="min-h-36 font-mono text-sm"
                  id="system-prompt"
                  onChange={(event) => {
                    setDraftSettings((prev) => ({
                      ...prev,
                      systemPrompt: event.target.value,
                    }));
                  }}
                  placeholder="Leave blank to use the repository default system prompt."
                  value={draftSettings.systemPrompt}
                />
                <FieldDescription>
                  Leave blank to use the default system prompt from this repository.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              onClick={() => {
                setSettingsOpen(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
