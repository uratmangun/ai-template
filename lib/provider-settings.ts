"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ProviderSettings = {
  baseURL: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
};

export const SETTINGS_STORAGE_KEY = "ai-ide-template-settings-v2";

export const EMPTY_SETTINGS: ProviderSettings = {
  baseURL: "",
  apiKey: "",
  model: "",
  systemPrompt: "",
};

const SETTINGS_CHANGE_EVENT = "provider-settings-change";

let cachedRawSettings = "";
let cachedSnapshot: ProviderSettings = EMPTY_SETTINGS;

function parseSettings(raw: string): ProviderSettings {
  if (!raw) {
    return EMPTY_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>;
    const baseURL = parsed.baseURL ?? "";

    return {
      baseURL,
      apiKey: parsed.apiKey ?? "",
      model: baseURL.trim() ? (parsed.model ?? "") : "",
      systemPrompt: parsed.systemPrompt ?? "",
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}

function getSettingsSnapshot(): ProviderSettings {
  if (typeof window === "undefined") {
    return EMPTY_SETTINGS;
  }

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "";

  if (raw === cachedRawSettings) {
    return cachedSnapshot;
  }

  cachedRawSettings = raw;
  cachedSnapshot = parseSettings(raw);
  return cachedSnapshot;
}

export function loadSettings(): ProviderSettings {
  return getSettingsSnapshot();
}

export function persistSettings(settings: ProviderSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(settings);
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, raw);
  cachedRawSettings = raw;
  cachedSnapshot = { ...settings };
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT));
}

function subscribeSettings(onStoreChange: () => void) {
  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener(SETTINGS_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(SETTINGS_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function useProviderSettings() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => EMPTY_SETTINGS,
  );

  const updateSettings = useCallback(
    (updater: ProviderSettings | ((previous: ProviderSettings) => ProviderSettings)) => {
      const previous = getSettingsSnapshot();
      const next = typeof updater === "function" ? updater(previous) : updater;
      persistSettings(next);
    },
    [],
  );

  return { settings, updateSettings };
}
