import { create } from "zustand";
import {
  ActionMode,
  MetaProgress,
  Position,
  RuleLoadout,
  RunState,
  ScreenId,
  SettingsState
} from "../game/engine/types";
import {
  addRuleToBackpack,
  createCombatState,
  equipRule,
  getOwnedRuleIds,
  initializeCombatState,
  performPlayerCommand,
  unequipRule
} from "../game/engine/combatEngine";
import { ENEMY_MAP } from "../game/data/enemies";
import { RECIPE_DEFINITIONS } from "../game/data/recipes";
import { RULE_DEFINITIONS } from "../game/data/rules";
import { DEFAULT_META, loadMetaProgress, saveMetaProgress } from "../game/save/storage";
import { createRun, getNodeById, markNodeCleared, updateAuditHeat } from "../game/progression/runFactory";
import { playSfx } from "../game/audio/sfx";

interface SummaryState {
  title: string;
  text: string;
}

interface AppStore {
  screen: ScreenId;
  meta: MetaProgress;
  run: RunState | null;
  selectedAction: ActionMode;
  hoveredEnemyId: string | null;
  summary: SummaryState;
  roomNotice: string;
  boot: () => void;
  startRun: () => void;
  continueRun: () => void;
  goMenu: () => void;
  openCodex: () => void;
  openSettings: () => void;
  openCredits: () => void;
  selectAction: (mode: ActionMode) => void;
  hoverEnemy: (enemyId: string | null) => void;
  enterNode: (nodeId: string) => void;
  actOnTile: (position: Position) => void;
  actOnUnit: (enemyId: string) => void;
  useWait: () => void;
  chooseReward: (ruleId: string) => void;
  equipFromBackpack: (ruleId: string) => void;
  unequipFromSlot: (slot: keyof RuleLoadout) => void;
  leaveRoom: () => void;
  toggleSetting: (key: keyof SettingsState) => void;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function persistMeta(meta: MetaProgress): MetaProgress {
  saveMetaProgress(meta);
  return meta;
}

function mergeMeta(meta: MetaProgress, updates: Partial<MetaProgress>): MetaProgress {
  return persistMeta({
    ...meta,
    ...updates,
    settings: {
      ...meta.settings,
      ...updates.settings
    }
  });
}

function mergeDiscoveries(
  meta: MetaProgress,
  payload: {
    ruleIds?: string[];
    enemyIds?: string[];
    recipeIds?: string[];
  }
): MetaProgress {
  return mergeMeta(meta, {
    discoveredRuleIds: uniqueValues(meta.discoveredRuleIds.concat(payload.ruleIds ?? [])),
    discoveredEnemyIds: uniqueValues(meta.discoveredEnemyIds.concat(payload.enemyIds ?? [])),
    discoveredRecipeIds: uniqueValues(meta.discoveredRecipeIds.concat(payload.recipeIds ?? []))
  });
}

function currentNodeId(run: RunState): string | null {
  return run.currentNodeId;
}

function syncRun(meta: MetaProgress, run: RunState | null): MetaProgress {
  return mergeMeta(meta, {
    lastRun: run
  });
}

function resolveCombatResult(run: RunState, meta: MetaProgress) {
  const combat = run.currentCombat;

  if (!combat) {
    return {
      run,
      meta,
      screen: "nodeMap" as ScreenId,
      summary: {
        title: "",
        text: ""
      }
    };
  }

  let nextRun: RunState = {
    ...run,
    playerHp: combat.player.hp,
    unlockedStateSlot: run.unlockedStateSlot || combat.stateSlotUnlocked,
    currentCombat: combat
  };

  let nextMeta = mergeDiscoveries(meta, {
    recipeIds: combat.discoveredRecipeIds
  });

  if (combat.battleLost) {
    nextMeta = syncRun(nextMeta, null);
    return {
      run: nextRun,
      meta: nextMeta,
      screen: "summary" as ScreenId,
      summary: {
        title: "롤백 발생",
        text: "CANON이 당신을 원래 규칙으로 되돌렸다. 다시 침투해 더 많은 규칙을 훔쳐라."
      }
    };
  }

  if (!combat.battleWon) {
    nextMeta = syncRun(nextMeta, nextRun);
    return {
      run: nextRun,
      meta: nextMeta,
      screen: "combat" as ScreenId,
      summary: {
        title: "",
        text: ""
      }
    };
  }

  nextRun = markNodeCleared(nextRun, currentNodeId(run) ?? "");
  nextRun = updateAuditHeat(nextRun, combat.activeRecipeIds);
  nextRun.currentCombat = combat;

  nextMeta = mergeDiscoveries(nextMeta, {
    recipeIds: combat.activeRecipeIds,
    ruleIds: combat.victoryUnlockedRuleId ? [combat.victoryUnlockedRuleId] : []
  });

  if (combat.encounterType === "boss") {
    nextMeta = mergeMeta(nextMeta, {
      bestVictorySeed: run.seed
    });
    nextMeta = syncRun(nextMeta, null);

    return {
      run: nextRun,
      meta: nextMeta,
      screen: "summary" as ScreenId,
      summary: {
        title: "탈취 성공",
        text: "관리자 코어가 붕괴했다. 이제 규칙은 지켜지는 것이 아니라 훔쳐질 수 있음을 CANON도 알게 되었다."
      }
    };
  }

  nextMeta = syncRun(nextMeta, nextRun);

  return {
    run: nextRun,
    meta: nextMeta,
    screen: "reward" as ScreenId,
    summary: {
      title: "",
      text: ""
    }
  };
}

export const useAppStore = create<AppStore>((set, get) => ({
  screen: "menu",
  meta: DEFAULT_META,
  run: null,
  selectedAction: "move",
  hoveredEnemyId: null,
  summary: {
    title: "",
    text: ""
  },
  roomNotice: "",
  boot: () => {
    const meta = loadMetaProgress();
    set({
      meta,
      run: meta.lastRun,
      screen: "menu"
    });
  },
  startRun: () => {
    const run = createRun("patcher", Date.now());
    const meta = syncRun(get().meta, run);

    set({
      meta,
      run,
      screen: "nodeMap",
      selectedAction: "move",
      hoveredEnemyId: null,
      summary: {
        title: "",
        text: ""
      },
      roomNotice: ""
    });
  },
  continueRun: () => {
    const run = get().meta.lastRun;

    if (!run) {
      return;
    }

    const nextScreen = run.currentCombat
      ? run.currentCombat.battleWon && run.currentCombat.encounterType !== "boss"
        ? "reward"
        : "combat"
      : "nodeMap";

    set({
      run,
      screen: nextScreen,
      selectedAction: "move"
    });
  },
  goMenu: () => {
    set({
      screen: "menu",
      selectedAction: "move",
      hoveredEnemyId: null
    });
  },
  openCodex: () => {
    set({
      screen: "codex"
    });
  },
  openSettings: () => {
    set({
      screen: "settings"
    });
  },
  openCredits: () => {
    set({
      screen: "credits"
    });
  },
  selectAction: (mode) => {
    set({
      selectedAction: mode
    });
  },
  hoverEnemy: (enemyId) => {
    set({
      hoveredEnemyId: enemyId
    });
  },
  enterNode: (nodeId) => {
    const { run, meta } = get();

    if (!run) {
      return;
    }

    const node = getNodeById(run, nodeId);

    if (!node || !node.available) {
      return;
    }

    if (node.type === "battle" || node.type === "elite" || node.type === "boss") {
      const combat = initializeCombatState(
        createCombatState(node.encounterId!, {
          playerHp: run.playerHp,
          maxHp: run.maxHp,
          auditHeat: run.auditHeat,
          equippedRules: run.equippedRules,
          backpackRules: run.backpackRules,
          unlockedStateSlot: run.unlockedStateSlot
        })
      );

      const nextRun: RunState = {
        ...run,
        currentNodeId: nodeId,
        currentCombat: combat
      };

      const nextMeta = syncRun(
        mergeDiscoveries(meta, {
          recipeIds: combat.activeRecipeIds
        }),
        nextRun
      );

      set({
        run: nextRun,
        meta: nextMeta,
        screen: "combat",
        selectedAction: "move",
        hoveredEnemyId: null
      });
      return;
    }

    if (node.type === "rest") {
      const nextRun = markNodeCleared(
        {
          ...run,
          currentNodeId: nodeId
        },
        nodeId
      );
      nextRun.playerHp = Math.min(nextRun.maxHp, nextRun.playerHp + 2);
      const nextMeta = syncRun(meta, nextRun);

      set({
        run: nextRun,
        meta: nextMeta,
        screen: "rest",
        roomNotice: "휴식실에서 안정화가 진행되어 체력을 2 회복했다."
      });
      return;
    }

    if (node.type === "lab") {
      const nextRun = markNodeCleared(
        {
          ...run,
          currentNodeId: nodeId
        },
        nodeId
      );
      const nextMeta = syncRun(meta, nextRun);

      set({
        run: nextRun,
        meta: nextMeta,
        screen: "lab",
        roomNotice: "실험실에 진입했다. 규칙을 재배치하고 패치를 확인하라."
      });
    }
  },
  actOnTile: (position) => {
    const { run, selectedAction, meta } = get();

    if (!run?.currentCombat || selectedAction !== "move") {
      return;
    }

    const combat = performPlayerCommand(run.currentCombat, {
      type: "move",
      position
    });

    const resolved = resolveCombatResult(
      {
        ...run,
        currentCombat: combat
      },
      meta
    );

    playSfx("patch", meta.settings.sfxEnabled);

    set({
      run: resolved.run,
      meta: resolved.meta,
      screen: resolved.screen,
      summary: resolved.summary
    });
  },
  actOnUnit: (enemyId) => {
    const { run, selectedAction, meta } = get();

    if (!run?.currentCombat) {
      return;
    }

    let command = null as
      | {
          type: "attack" | "scan" | "sever" | "shove";
          targetId: string;
        }
      | null;

    if (selectedAction === "attack") {
      command = { type: "attack", targetId: enemyId };
    } else if (selectedAction === "scan") {
      command = { type: "scan", targetId: enemyId };
    } else if (selectedAction === "sever") {
      command = { type: "sever", targetId: enemyId };
    } else if (selectedAction === "shove") {
      command = { type: "shove", targetId: enemyId };
    }

    if (!command) {
      set({
        hoveredEnemyId: enemyId
      });
      return;
    }

    const combat = performPlayerCommand(run.currentCombat, command);

    let nextMeta = meta;

    if (command.type === "scan") {
      const enemy = combat.enemies.find((entry) => entry.id === enemyId);

      if (enemy) {
        const enemyDef = ENEMY_MAP[enemy.templateId];
        nextMeta = mergeDiscoveries(meta, {
          enemyIds: [enemy.templateId],
          ruleIds: enemy.signatureRuleId ? [enemy.signatureRuleId] : [],
          recipeIds: combat.discoveredRecipeIds
        });
      }
    }

    const resolved = resolveCombatResult(
      {
        ...run,
        currentCombat: combat
      },
      nextMeta
    );

    if (command.type === "attack" || command.type === "shove") {
      playSfx("attack", meta.settings.sfxEnabled);
    } else if (command.type === "sever") {
      playSfx("damage", meta.settings.sfxEnabled);
    } else if (command.type === "scan") {
      playSfx("patch", meta.settings.sfxEnabled);
    }

    if (resolved.screen === "summary" && resolved.summary.title === "탈취 성공") {
      playSfx("phase", meta.settings.sfxEnabled);
    }

    set({
      run: resolved.run,
      meta: resolved.meta,
      screen: resolved.screen,
      summary: resolved.summary,
      hoveredEnemyId: enemyId
    });
  },
  useWait: () => {
    const { run, meta } = get();

    if (!run?.currentCombat) {
      return;
    }

    const combat = performPlayerCommand(run.currentCombat, {
      type: "wait"
    });

    const resolved = resolveCombatResult(
      {
        ...run,
        currentCombat: combat
      },
      meta
    );

    playSfx("patch", meta.settings.sfxEnabled);

    set({
      run: resolved.run,
      meta: resolved.meta,
      screen: resolved.screen,
      summary: resolved.summary
    });
  },
  chooseReward: (ruleId) => {
    const { run, meta } = get();

    if (!run?.currentCombat) {
      return;
    }

    const backpackUpdate = addRuleToBackpack(
      {
        backpackRules: run.backpackRules,
        equippedRules: run.equippedRules
      },
      ruleId
    );

    const nextRun: RunState = {
      ...run,
      backpackRules: backpackUpdate.backpackRules,
      currentCombat: null,
      playerHp: run.currentCombat.player.hp,
      unlockedStateSlot: run.unlockedStateSlot || run.currentCombat.stateSlotUnlocked
    };

    const nextMeta = syncRun(
      mergeDiscoveries(meta, {
        ruleIds: [ruleId],
        recipeIds: run.currentCombat.discoveredRecipeIds
      }),
      nextRun
    );

    playSfx("steal", meta.settings.sfxEnabled);

    set({
      run: nextRun,
      meta: nextMeta,
      screen: "nodeMap"
    });
  },
  equipFromBackpack: (ruleId) => {
    const { run, screen, meta } = get();

    if (!run || (screen !== "lab" && screen !== "rest")) {
      return;
    }

    const rule = RULE_DEFINITIONS.find((entry) => entry.id === ruleId);

    if (!rule) {
      return;
    }

    if (rule.category === "state" && !run.unlockedStateSlot) {
      return;
    }

    const next = equipRule(run.equippedRules, run.backpackRules, ruleId);
    const nextRun = {
      ...run,
      equippedRules: next.loadout,
      backpackRules: next.backpackRules
    };
    const nextMeta = syncRun(meta, nextRun);

    set({
      run: nextRun,
      meta: nextMeta
    });
  },
  unequipFromSlot: (slot) => {
    const { run, screen, meta } = get();

    if (!run || (screen !== "lab" && screen !== "rest")) {
      return;
    }

    if (slot === "state" && !run.unlockedStateSlot) {
      return;
    }

    const next = unequipRule(run.equippedRules, run.backpackRules, slot);
    const nextRun = {
      ...run,
      equippedRules: next.loadout,
      backpackRules: next.backpackRules
    };
    const nextMeta = syncRun(meta, nextRun);

    set({
      run: nextRun,
      meta: nextMeta
    });
  },
  leaveRoom: () => {
    const { run, meta } = get();

    if (!run) {
      return;
    }

    const nextMeta = syncRun(meta, run);

    set({
      run,
      meta: nextMeta,
      screen: "nodeMap",
      roomNotice: ""
    });
  },
  toggleSetting: (key) => {
    const { meta } = get();
    const settings = {
      ...meta.settings,
      [key]: !meta.settings[key]
    } as SettingsState;
    const nextMeta = mergeMeta(meta, {
      settings
    });

    set({
      meta: nextMeta
    });
  }
}));
