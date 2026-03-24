import { MetaProgress, SettingsState } from "../engine/types";

export const SAVE_KEY = "rule-thief-save-v1";

export const DEFAULT_SETTINGS: SettingsState = {
  sfxEnabled: true,
  bgmEnabled: true,
  screenShake: true,
  highContrast: false,
  language: "kr"
};

export const DEFAULT_META: MetaProgress = {
  discoveredRuleIds: [],
  discoveredEnemyIds: [],
  discoveredRecipeIds: [],
  bestVictorySeed: null,
  lastRun: null,
  settings: DEFAULT_SETTINGS
};

export function loadMetaProgress(): MetaProgress {
  if (typeof localStorage === "undefined") {
    return DEFAULT_META;
  }

  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return DEFAULT_META;
  }

  try {
    const parsed = JSON.parse(raw) as MetaProgress;
    return {
      ...DEFAULT_META,
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings
      }
    };
  } catch (error) {
    return DEFAULT_META;
  }
}

export function saveMetaProgress(meta: MetaProgress): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
}
