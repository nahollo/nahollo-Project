import { ENCOUNTER_MAP } from "../data/encounters";
import { ENEMY_MAP } from "../data/enemies";
import { RECIPE_DEFINITIONS } from "../data/recipes";
import { RULE_DEFINITIONS, RULE_MAP } from "../data/rules";
import {
  directionFromTo,
  facingVector,
  isInsideBoard,
  manhattanDistance,
  orthogonalNeighbors,
  positionKey,
  samePosition,
  tileAt
} from "../utils/grid";
import {
  ActionMode,
  ChainContext,
  CombatState,
  CombatantFlags,
  CombatantState,
  CorpseState,
  IntentInfo,
  LogEntry,
  Position,
  RewardChoice,
  RuleCategory,
  RuleDefinition,
  RuleLoadout,
  SealState,
  ShardState,
  StatusId,
  StatusInstance,
  TileKind,
  ToolId,
  ToolRuntime
} from "./types";

export interface PlayerCommand {
  type: Exclude<ActionMode, "interact" | null>;
  targetId?: string;
  position?: Position;
}

interface DamageSource {
  sourceId: string | null;
  type: "attack" | "counter" | "hazard" | "explosion" | "poison";
  melee: boolean;
}

const SLOT_ORDER: Array<keyof RuleLoadout> = [
  "movement",
  "combat",
  "state",
  "termination"
];

const NEGATIVE_STATUSES = new Set<StatusId>(["poison", "fragile", "silence"]);

const TOOL_LIBRARY: Record<ToolId, Omit<ToolRuntime, "cooldown" | "usedThisRound">> = {
  scan: {
    id: "scan",
    koreanName: "스캔",
    englishName: "Scan",
    maxCooldown: 0,
    oncePerRound: true
  },
  sever: {
    id: "sever",
    koreanName: "절단",
    englishName: "Sever",
    maxCooldown: 3,
    oncePerRound: false
  },
  shove: {
    id: "shove",
    koreanName: "밀치기",
    englishName: "Shove",
    maxCooldown: 1,
    oncePerRound: false
  },
  wait: {
    id: "wait",
    koreanName: "대기",
    englishName: "Wait",
    maxCooldown: 0,
    oncePerRound: false
  },
  overwrite: {
    id: "overwrite",
    koreanName: "덮어쓰기",
    englishName: "Overwrite",
    maxCooldown: 4,
    oncePerRound: false
  }
};

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function createFlags(): CombatantFlags {
  return {
    movedThisRound: false,
    directAttackCount: 0,
    lineCharge: 0,
    lineDashReady: false,
    phaseWalkUsed: false,
    echoTile: null,
    echoDodgeReady: false,
    frontalCounterUsed: false,
    silencingStrikeUsed: false,
    firstCurseMirrorUsed: false,
    executionCacheUsed: false,
    ghostCounterReady: false,
    copiedToolId: null,
    copiedTurnsRemaining: 0,
    extraActionReady: false,
    recentShoveCollision: false,
    mirroredRuleId: null,
    bossPhase: 1
  };
}

function createTools(): Record<ToolId, ToolRuntime> {
  return {
    scan: { ...TOOL_LIBRARY.scan, cooldown: 0, usedThisRound: false },
    sever: { ...TOOL_LIBRARY.sever, cooldown: 0, usedThisRound: false },
    shove: { ...TOOL_LIBRARY.shove, cooldown: 0, usedThisRound: false },
    wait: { ...TOOL_LIBRARY.wait, cooldown: 0, usedThisRound: false },
    overwrite: { ...TOOL_LIBRARY.overwrite, cooldown: 0, usedThisRound: false }
  };
}

function createSealState(): SealState {
  return {
    movement: 0,
    combat: 0,
    state: 0,
    termination: 0
  };
}

function addLog(
  state: CombatState,
  text: string,
  accent: LogEntry["accent"] = "cyan"
): void {
  state.log.unshift({
    id: `${state.battleId}-log-${state.log.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
    round: state.round,
    text,
    accent
  });
  state.log = state.log.slice(0, 20);
}

function getRule(ruleId: string | null | undefined): RuleDefinition | null {
  if (!ruleId) {
    return null;
  }

  return RULE_MAP[ruleId] ?? null;
}

function ruleSlot(ruleId: string): keyof RuleLoadout {
  return (getRule(ruleId)?.category ?? "combat") as keyof RuleLoadout;
}

function createPlayerCombatant(
  playerHp: number,
  maxHp: number,
  position: Position
): CombatantState {
  return {
    id: "player",
    templateId: "patcher",
    koreanName: "패처",
    hp: playerHp,
    maxHp,
    damage: 1,
    position,
    facing: "up",
    isPlayer: true,
    alive: true,
    statuses: [],
    signatureDisabledRounds: 0,
    theftMarked: false,
    theftSatisfied: false,
    scanned: true,
    intent: null,
    team: "player",
    flags: createFlags()
  };
}

function createEnemyCombatant(
  enemyId: string,
  position: Position,
  index: number
): CombatantState {
  const enemy = ENEMY_MAP[enemyId];

  return {
    id: `${enemyId}-${index + 1}`,
    templateId: enemy.id,
    koreanName: enemy.koreanName,
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    damage: enemy.damage,
    position,
    facing: "down",
    isPlayer: false,
    alive: true,
    statuses: [],
    signatureRuleId: enemy.signatureRuleId,
    signatureDisabledRounds: 0,
    theftConditionId: enemy.theftConditionId,
    theftMarked: false,
    theftSatisfied: false,
    scanned: false,
    intent: null,
    team: "enemy",
    flags: createFlags()
  };
}

function buildTiles(mapTemplate: string[]): CombatState["tiles"] {
  const tiles: CombatState["tiles"] = [];

  mapTemplate.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      let kind: TileKind = "floor";

      if (cell === "#") {
        kind = "wall";
      } else if (cell === "^") {
        kind = "hazard";
      } else if (cell === "C") {
        kind = "console";
      }

      tiles.push({
        position: { x, y },
        kind,
        active: true
      });
    });
  });

  return tiles;
}

export function getActiveRecipeIds(loadout: RuleLoadout, stateSlotUnlocked: boolean): string[] {
  const equippedRuleIds = SLOT_ORDER.flatMap((slot) => {
    if (slot === "state" && !stateSlotUnlocked) {
      return [];
    }

    return loadout[slot] ? [loadout[slot] as string] : [];
  });

  const equippedSet = new Set(equippedRuleIds);

  return RECIPE_DEFINITIONS.filter((recipe) =>
    recipe.requiredRuleIds.every((ruleId) => equippedSet.has(ruleId))
  ).map((recipe) => recipe.id);
}

export function getRecipeName(recipeId: string): string {
  return RECIPE_DEFINITIONS.find((recipe) => recipe.id === recipeId)?.koreanName ?? recipeId;
}

function injectAuditPressure(state: CombatState): void {
  const candidateTiles = state.tiles.filter(
    (tile) =>
      tile.kind === "floor" &&
      !samePosition(tile.position, state.player.position) &&
      !state.enemies.some((enemy) => samePosition(enemy.position, tile.position))
  );

  candidateTiles
    .sort(
      (left, right) =>
        manhattanDistance(state.player.position, right.position) -
        manhattanDistance(state.player.position, left.position)
    )
    .slice(0, Math.min(2, state.auditHeat))
    .forEach((tile) => {
      const found = tileAt(state.tiles, tile.position);

      if (found) {
        found.kind = "hazard";
      }
    });
}

export function createCombatState(
  encounterId: string,
  run: {
    playerHp: number;
    maxHp: number;
    auditHeat: number;
    equippedRules: RuleLoadout;
    backpackRules: string[];
    unlockedStateSlot: boolean;
  }
): CombatState {
  const encounter = ENCOUNTER_MAP[encounterId];
  const activeRecipeIds = getActiveRecipeIds(run.equippedRules, run.unlockedStateSlot);
  const battleId = `${encounterId}-${Date.now()}`;

  const state: CombatState = {
    battleId,
    encounterId,
    encounterType: encounter.type,
    round: 1,
    playerTurn: true,
    player: createPlayerCombatant(run.playerHp, run.maxHp, encounter.playerStart),
    enemies: encounter.enemyIds.map((enemyId, index) =>
      createEnemyCombatant(enemyId, encounter.enemyStarts[index], index)
    ),
    tiles: buildTiles(encounter.mapTemplate),
    corpses: [],
    shards: [],
    log: [],
    tools: createTools(),
    equippedRules: cloneValue(run.equippedRules),
    backpackRules: [...run.backpackRules],
    rewardChoices: [],
    activeRecipeIds,
    discoveredRecipeIds: [...activeRecipeIds],
    scanAvailable: true,
    selectedEnemyId: null,
    remainingCommands: 1,
    availableBonusMoves: 0,
    stateSlotUnlocked: run.unlockedStateSlot,
    auditHeat: run.auditHeat,
    auditWarning: run.auditHeat >= 2,
    sealedSlots: createSealState(),
    nextChainId: 1,
    battleWon: false,
    battleLost: false,
    victoryUnlockedRuleId: null,
    lastUsedToolId: null
  };

  addLog(state, encounter.flavor, "magenta");

  if (state.auditWarning) {
    addLog(state, "AUDIT RISING | 감사 열이 상승해 전장이 거칠어졌다.", "danger");
    injectAuditPressure(state);
  }

  if (activeRecipeIds.length > 0) {
    addLog(state, `패치 적용 | ${activeRecipeIds.map(getRecipeName).join(", ")}`, "acid");
  }

  return state;
}

function getCombatantById(state: CombatState, combatantId: string): CombatantState | undefined {
  if (combatantId === "player") {
    return state.player;
  }

  return state.enemies.find((enemy) => enemy.id === combatantId);
}

function withCombatant(
  state: CombatState,
  combatantId: string,
  updater: (combatant: CombatantState) => void
): void {
  if (combatantId === "player") {
    updater(state.player);
    return;
  }

  const enemy = state.enemies.find((entry) => entry.id === combatantId);

  if (enemy) {
    updater(enemy);
  }
}

function isNegativeStatus(statusId: StatusId): boolean {
  return NEGATIVE_STATUSES.has(statusId);
}

function hasStatus(combatant: CombatantState, statusId: StatusId): boolean {
  return combatant.statuses.some((status) => status.id === statusId);
}

function removeStatus(combatant: CombatantState, statusId: StatusId): void {
  combatant.statuses = combatant.statuses.filter((status) => status.id !== statusId);
}

function upsertStatus(combatant: CombatantState, status: StatusInstance): void {
  const existing = combatant.statuses.find((entry) => entry.id === status.id);

  if (existing) {
    existing.duration = Math.max(existing.duration, status.duration);
    existing.sourceId = status.sourceId ?? existing.sourceId;
    existing.negative = status.negative;
  } else {
    combatant.statuses.push(status);
  }
}

function chainInstanceKey(combatantId: string, ruleId: string): string {
  return `${combatantId}:${ruleId}`;
}

function ensureChainDepth(state: CombatState, chain: ChainContext, depth: number): ChainContext {
  if (depth <= 8) {
    return {
      ...chain,
      depth
    };
  }

  if (!chain.limitReached) {
    addLog(state, "CHAIN LIMIT | 후속 반응이 안전 한계를 넘어 중단되었다.", "danger");
  }

  return {
    ...chain,
    depth,
    limitReached: true
  };
}

function createChain(state: CombatState): ChainContext {
  const chainId = state.nextChainId;
  state.nextChainId += 1;

  return {
    id: `${state.battleId}-chain-${chainId}`,
    depth: 0,
    triggeredRuleInstances: [],
    limitReached: false
  };
}

function markRuleTriggered(
  state: CombatState,
  chain: ChainContext,
  combatantId: string,
  ruleId: string,
  depth: number
): ChainContext | null {
  const nextChain = ensureChainDepth(state, chain, depth);

  if (nextChain.limitReached) {
    return null;
  }

  const key = chainInstanceKey(combatantId, ruleId);

  if (nextChain.triggeredRuleInstances.includes(key)) {
    return null;
  }

  nextChain.triggeredRuleInstances.push(key);
  return nextChain;
}

function isSlotSealed(state: CombatState, slot: keyof RuleLoadout): boolean {
  if (slot === "state" && !state.stateSlotUnlocked) {
    return true;
  }

  return state.sealedSlots[slot] > 0;
}

function getPlayerRuleIds(state: CombatState): string[] {
  return SLOT_ORDER.flatMap((slot) => {
    if (isSlotSealed(state, slot)) {
      return [];
    }

    const ruleId = state.equippedRules[slot];
    return ruleId ? [ruleId] : [];
  });
}

function getCombatantRuleIds(state: CombatState, combatant: CombatantState): string[] {
  if (!combatant.alive) {
    return [];
  }

  if (combatant.isPlayer) {
    return getPlayerRuleIds(state);
  }

  const ruleIds: string[] = [];

  if (
    combatant.signatureRuleId &&
    combatant.signatureDisabledRounds <= 0 &&
    !hasStatus(combatant, "silence")
  ) {
    ruleIds.push(combatant.signatureRuleId);
  }

  if (combatant.flags.mirroredRuleId) {
    ruleIds.push(combatant.flags.mirroredRuleId);
  }

  return ruleIds;
}

function hasRule(state: CombatState, combatant: CombatantState, ruleId: string): boolean {
  return getCombatantRuleIds(state, combatant).includes(ruleId);
}

function findOccupantAt(state: CombatState, position: Position): CombatantState | null {
  if (state.player.alive && samePosition(state.player.position, position)) {
    return state.player;
  }

  return state.enemies.find((enemy) => enemy.alive && samePosition(enemy.position, position)) ?? null;
}

function getCorpseAt(state: CombatState, position: Position): CorpseState | null {
  return state.corpses.find((corpse) => samePosition(corpse.position, position)) ?? null;
}

function getShardAt(state: CombatState, position: Position): ShardState | null {
  return state.shards.find((shard) => samePosition(shard.position, position)) ?? null;
}

function tileKind(state: CombatState, position: Position): TileKind | null {
  return tileAt(state.tiles, position)?.kind ?? null;
}

function isBlocked(state: CombatState, position: Position): boolean {
  if (!isInsideBoard(position)) {
    return true;
  }

  const tile = tileAt(state.tiles, position);

  if (!tile || tile.kind === "wall") {
    return true;
  }

  const corpse = getCorpseAt(state, position);

  if (corpse?.blocksMovement) {
    return true;
  }

  return findOccupantAt(state, position) !== null;
}

function addStatusToCombatant(
  state: CombatState,
  targetId: string,
  statusId: StatusId,
  duration: number,
  sourceId: string | null,
  chain: ChainContext,
  depth = chain.depth
): void {
  const target = getCombatantById(state, targetId);

  if (!target || !target.alive) {
    return;
  }

  let finalStatus: StatusId = statusId;
  const negative = isNegativeStatus(statusId);

  if (negative && hasRule(state, target, "toxin-reversal") && statusId === "poison") {
    const nextChain = markRuleTriggered(state, chain, target.id, "toxin-reversal", depth + 1);

    if (nextChain) {
      finalStatus = "regen";
      addLog(state, `${target.koreanName}의 독이 재생으로 반전되었다.`, "acid");
    }
  }

  if (negative && hasRule(state, target, "first-curse-mirror") && !target.flags.firstCurseMirrorUsed) {
    const nextChain = markRuleTriggered(state, chain, target.id, "first-curse-mirror", depth + 1);

    if (nextChain) {
      target.flags.firstCurseMirrorUsed = true;

      if (sourceId) {
        addLog(state, `${target.koreanName}이 첫 저주를 반사했다.`, "magenta");
        addStatusToCombatant(state, sourceId, statusId, duration, target.id, nextChain, nextChain.depth);
      }

      return;
    }
  }

  upsertStatus(target, {
    id: finalStatus,
    duration: finalStatus === "guard" ? 99 : duration,
    negative: isNegativeStatus(finalStatus),
    sourceId
  });

  if (finalStatus === "silence") {
    target.signatureDisabledRounds = Math.max(target.signatureDisabledRounds, duration);
  }
}

function healCombatant(state: CombatState, combatantId: string, amount: number): void {
  withCombatant(state, combatantId, (combatant) => {
    combatant.hp = Math.min(combatant.maxHp, combatant.hp + amount);
  });
}

function availableRulesPool(state: CombatState): RuleDefinition[] {
  const owned = new Set(
    SLOT_ORDER.flatMap((slot) => {
      const ruleId = state.equippedRules[slot];
      return ruleId ? [ruleId] : [];
    }).concat(state.backpackRules)
  );

  return RULE_DEFINITIONS.filter(
    (rule) =>
      !owned.has(rule.id) &&
      (!rule.signatureFromEnemyId || state.stateSlotUnlocked || rule.category !== "state")
  );
}

function chooseRewardChoices(state: CombatState): RewardChoice[] {
  const markedRuleIds = state.enemies
    .filter((enemy) => !enemy.alive && enemy.theftMarked && enemy.signatureRuleId)
    .map((enemy) => ({
      ruleId: enemy.signatureRuleId as string,
      sourceLabel: `${enemy.koreanName}의 시그니처`
    }));

  const rewards: RewardChoice[] = [];
  const seen = new Set<string>();

  markedRuleIds.forEach((reward, index) => {
    if (!seen.has(reward.ruleId)) {
      seen.add(reward.ruleId);
      rewards.push({
        id: `reward-signature-${index + 1}-${reward.ruleId}`,
        ruleId: reward.ruleId,
        sourceLabel: reward.sourceLabel
      });
    }
  });

  const fallbackRules = availableRulesPool(state).slice(0, 3);

  fallbackRules.forEach((rule, index) => {
    if (!seen.has(rule.id) && rewards.length < 3) {
      seen.add(rule.id);
      rewards.push({
        id: `reward-common-${index + 1}-${rule.id}`,
        ruleId: rule.id,
        sourceLabel: "공용 패치"
      });
    }
  });

  if (state.encounterType === "elite" && state.stateSlotUnlocked) {
    const bonusStateRule = RULE_DEFINITIONS.find(
      (rule) => rule.category === "state" && !seen.has(rule.id)
    );

    if (bonusStateRule && rewards.length < 3) {
      rewards.push({
        id: `reward-elite-${bonusStateRule.id}`,
        ruleId: bonusStateRule.id,
        sourceLabel: "거울 실험 데이터"
      });
    }
  }

  return rewards.slice(0, 3);
}

function createCorpse(
  state: CombatState,
  dead: CombatantState,
  blocking: boolean,
  hazardous: boolean
): void {
  state.corpses.push({
    id: `corpse-${dead.id}-${state.round}`,
    position: cloneValue(dead.position),
    duration: blocking ? 2 : 1,
    blocksMovement: blocking,
    hazardous,
    hazardConsumed: false
  });
}

function createShard(state: CombatState, position: Position): void {
  state.shards.push({
    id: `shard-${position.x}-${position.y}-${state.round}`,
    position: cloneValue(position),
    heal: 1
  });
}

function consumeGuard(target: CombatantState): boolean {
  const guard = target.statuses.find((status) => status.id === "guard");

  if (!guard) {
    return false;
  }

  removeStatus(target, "guard");
  return true;
}

function consumeFragile(target: CombatantState): boolean {
  const fragile = target.statuses.find((status) => status.id === "fragile");

  if (!fragile) {
    return false;
  }

  removeStatus(target, "fragile");
  return true;
}

function resolveTheftCondition(state: CombatState, enemyId: string): void {
  withCombatant(state, enemyId, (enemy) => {
    if (!enemy.scanned || enemy.theftMarked) {
      return;
    }

    enemy.theftSatisfied = true;
    enemy.theftMarked = true;
    addLog(state, `${enemy.koreanName}에 탈취 마크가 새겨졌다.`, "gold");
  });
}

function maybeMarkTheftFromEvent(
  state: CombatState,
  enemyId: string,
  eventId:
    | "watch-counter"
    | "indirect-kill"
    | "phase-adjacent-wall"
    | "shove-collision"
    | "copied-then-kill"
    | "sealed-slot-kill"
    | "extra-action-round"
): void {
  const enemy = getCombatantById(state, enemyId);

  if (!enemy || !enemy.alive || enemy.theftConditionId !== eventId) {
    return;
  }

  resolveTheftCondition(state, enemyId);
}

function maybeCreateUnstableResidue(state: CombatState, target: CombatantState): void {
  if (!hasRule(state, target, "unstable-body")) {
    return;
  }

  state.corpses.push({
    id: `residue-${target.id}-${state.round}`,
    position: cloneValue(target.position),
    duration: 1,
    blocksMovement: false,
    hazardous: true,
    hazardConsumed: false
  });
}

function reduceOneCooldown(state: CombatState): void {
  const tools = Object.values(state.tools)
    .filter((tool) => tool.cooldown > 0)
    .sort((left, right) => right.cooldown - left.cooldown);

  if (tools.length > 0) {
    tools[0].cooldown = Math.max(0, tools[0].cooldown - 1);
    addLog(state, `실행 캐시 | ${tools[0].koreanName} 재사용 대기시간이 감소했다.`, "acid");
  }
}

function damageAdjacentFrom(
  state: CombatState,
  origin: Position,
  sourceId: string,
  chain: ChainContext,
  depth: number
): void {
  orthogonalNeighbors(origin)
    .sort((left, right) => positionKey(left).localeCompare(positionKey(right)))
    .forEach((position) => {
      const target = findOccupantAt(state, position);

      if (target) {
        const nestedChain = ensureChainDepth(state, chain, depth + 1);

        if (!nestedChain.limitReached) {
          applyDamage(
            state,
            target.id,
            1,
            {
              sourceId,
              type: "explosion",
              melee: false
            },
            nestedChain,
            false
          );
        }
      }
    });
}

function handleDeath(
  state: CombatState,
  deadId: string,
  sourceId: string | null,
  chain: ChainContext,
  depth: number
): void {
  const dead = getCombatantById(state, deadId);

  if (!dead || !dead.alive) {
    return;
  }

  dead.alive = false;
  dead.hp = 0;
  dead.intent = null;

  addLog(state, `${dead.koreanName}이(가) 무너졌다.`, dead.isPlayer ? "danger" : "cyan");

  if (dead.isPlayer) {
    state.battleLost = true;
    state.playerTurn = false;
    return;
  }

  const corpseWall = hasRule(state, state.player, "corpse-wall");
  const corpseBurst = hasRule(state, state.player, "corpse-burst");
  const reclaimShard = hasRule(state, state.player, "reclaim-shard");
  const executionCache = hasRule(state, state.player, "execution-cache");
  const shardBarricade = state.activeRecipeIds.includes("shard-barricade");

  const corpseWallChain = corpseWall
    ? markRuleTriggered(state, chain, "player", "corpse-wall", depth + 1)
    : null;
  const reclaimShardChain = reclaimShard
    ? markRuleTriggered(state, chain, "player", "reclaim-shard", depth + 1)
    : null;
  const executionCacheChain = executionCache
    ? markRuleTriggered(state, chain, "player", "execution-cache", depth + 1)
    : null;
  const corpseBurstChain = corpseBurst
    ? markRuleTriggered(state, chain, "player", "corpse-burst", depth + 1)
    : null;

  createCorpse(
    state,
    dead,
    Boolean(corpseWallChain),
    Boolean(corpseWallChain && shardBarricade && corpseBurst)
  );

  if (reclaimShardChain) {
    createShard(state, dead.position);
  }

  if (executionCacheChain && !state.player.flags.executionCacheUsed) {
    state.player.flags.executionCacheUsed = true;
    reduceOneCooldown(state);
  }

  if (corpseBurstChain) {
    damageAdjacentFrom(state, dead.position, "player", corpseBurstChain, depth + 1);
  }

  if (dead.signatureRuleId === "corpse-burst" && dead.signatureDisabledRounds <= 0) {
    damageAdjacentFrom(state, dead.position, dead.id, chain, depth + 1);
  }

  if (state.encounterType === "elite" && dead.templateId === "mirror-witch") {
    state.stateSlotUnlocked = true;
    addLog(state, "상태 슬롯이 해금되었다.", "gold");
  }

  if (state.enemies.every((enemy) => !enemy.alive)) {
    state.battleWon = true;

    if (state.encounterType === "boss") {
      state.victoryUnlockedRuleId = "clock-surge";
      addLog(state, "관리자 코어가 붕괴했다. 탈취 런 성공.", "gold");
    } else {
      state.rewardChoices = chooseRewardChoices(state);
    }
  }

  if (sourceId) {
    const source = getCombatantById(state, sourceId);

    if (source && source.templateId === "slime-mass") {
      maybeMarkTheftFromEvent(state, source.id, "indirect-kill");
    }
  }
}

function isFrontAttack(target: CombatantState, attacker: CombatantState): boolean {
  const vector = facingVector(target.facing);
  return (
    target.position.x + vector.x === attacker.position.x &&
    target.position.y + vector.y === attacker.position.y
  );
}

function triggerFrontalCounter(
  state: CombatState,
  target: CombatantState,
  attacker: CombatantState,
  chain: ChainContext,
  ignoreFacing: boolean
): void {
  if (
    !hasRule(state, target, "frontal-counter") ||
    target.flags.frontalCounterUsed ||
    target.flags.movedThisRound
  ) {
    return;
  }

  if (!ignoreFacing && !isFrontAttack(target, attacker)) {
    return;
  }

  const nextChain = markRuleTriggered(state, chain, target.id, "frontal-counter", chain.depth + 1);

  if (!nextChain) {
    return;
  }

  target.flags.frontalCounterUsed = true;
  target.flags.ghostCounterReady = false;
  addLog(state, `${target.koreanName}의 정면반격이 발동했다.`, "magenta");
  maybeMarkTheftFromEvent(state, target.id, "watch-counter");

  applyDamage(
    state,
    attacker.id,
    1,
    {
      sourceId: target.id,
      type: "counter",
      melee: true
    },
    nextChain,
    false
  );
}

function applyDamage(
  state: CombatState,
  targetId: string,
  amount: number,
  source: DamageSource,
  chain: ChainContext,
  canTriggerReactions: boolean
): void {
  const target = getCombatantById(state, targetId);

  if (!target || !target.alive) {
    return;
  }

  const sourceUnit = source.sourceId ? getCombatantById(state, source.sourceId) : null;

  if (target.flags.echoDodgeReady && source.type === "attack") {
    target.flags.echoDodgeReady = false;
    addLog(state, `${target.koreanName}이 잔상으로 공격을 흘려냈다.`, "acid");
    return;
  }

  let damage = amount;

  if (consumeGuard(target)) {
    damage = Math.max(0, damage - 1);
    addLog(state, `${target.koreanName}의 보호막이 충격을 흡수했다.`, "acid");
  }

  if (consumeFragile(target)) {
    damage += 1;
    addLog(state, `${target.koreanName}의 취약이 추가 피해로 변환되었다.`, "danger");
  }

  if (damage <= 0) {
    return;
  }

  target.hp = Math.max(0, target.hp - damage);
  addLog(
    state,
    `${target.koreanName}이(가) ${damage} 피해를 받았다.`,
    target.isPlayer ? "danger" : "cyan"
  );

  if (source.type === "hazard" || source.type === "explosion" || source.type === "poison") {
    maybeMarkTheftFromEvent(state, target.id, "indirect-kill");
  }

  if (source.type === "attack" && source.melee) {
    maybeCreateUnstableResidue(state, target);
  }

  if (target.hp <= 0) {
    handleDeath(state, target.id, source.sourceId, chain, chain.depth);
    return;
  }

  if (canTriggerReactions && source.melee && sourceUnit && source.type === "attack") {
    triggerFrontalCounter(
      state,
      target,
      sourceUnit,
      chain,
      target.flags.ghostCounterReady
    );
  }
}

function applyTileEffects(state: CombatState, combatantId: string, chain: ChainContext): void {
  const combatant = getCombatantById(state, combatantId);

  if (!combatant || !combatant.alive) {
    return;
  }

  const tile = tileAt(state.tiles, combatant.position);

  if (tile?.kind === "hazard") {
    applyDamage(
      state,
      combatantId,
      1,
      {
        sourceId: null,
        type: "hazard",
        melee: false
      },
      chain,
      false
    );
  }

  const corpse = getCorpseAt(state, combatant.position);

  if (corpse?.hazardous && !corpse.hazardConsumed) {
    corpse.hazardConsumed = true;
    applyDamage(
      state,
      combatantId,
      1,
      {
        sourceId: null,
        type: "hazard",
        melee: false
      },
      chain,
      false
    );
  }

  const shard = getShardAt(state, combatant.position);

  if (shard) {
    const boss = state.enemies.find(
      (enemy) => enemy.templateId === "dungeon-administrator" && enemy.alive
    );
    const enforcing = Boolean(boss && boss.flags.bossPhase >= 3 && combatant.isPlayer);

    if (enforcing) {
      addLog(state, "집행 단계 | 회복 파편이 적대 신호로 뒤집혔다.", "danger");
      applyDamage(
        state,
        combatantId,
        1,
        {
          sourceId: boss?.id ?? null,
          type: "hazard",
          melee: false
        },
        chain,
        false
      );
    } else {
      healCombatant(state, combatantId, shard.heal);
      addLog(state, `${combatant.koreanName}이(가) 회수 잔해를 흡수했다.`, "acid");
    }

    state.shards = state.shards.filter((entry) => entry.id !== shard.id);
  }
}

function moveCombatantTo(
  state: CombatState,
  combatantId: string,
  destination: Position,
  chain: ChainContext,
  phasedMove: boolean
): boolean {
  const combatant = getCombatantById(state, combatantId);

  if (!combatant || !combatant.alive) {
    return false;
  }

  if (findOccupantAt(state, destination)) {
    return false;
  }

  const tile = tileAt(state.tiles, destination);

  if (!tile || tile.kind === "wall") {
    return false;
  }

  const corpse = getCorpseAt(state, destination);

  if (corpse?.blocksMovement) {
    return false;
  }

  const previousPosition = cloneValue(combatant.position);
  combatant.facing = directionFromTo(previousPosition, destination) ?? combatant.facing;
  combatant.position = cloneValue(destination);
  combatant.flags.movedThisRound = true;

  if (combatant.isPlayer) {
    if (hasRule(state, combatant, "echo-step")) {
      combatant.flags.echoTile = previousPosition;
      combatant.flags.echoDodgeReady = true;
    }

    if (phasedMove && state.activeRecipeIds.includes("ghost-counter")) {
      combatant.flags.ghostCounterReady = true;
      addLog(state, "패치 적용 | 유령 반격 준비.", "magenta");
    }

    if (hasRule(state, combatant, "line-dash")) {
      if (manhattanDistance(previousPosition, destination) >= 2) {
        combatant.flags.lineCharge = 0;
        combatant.flags.lineDashReady = false;
      } else {
        combatant.flags.lineCharge += 1;
      }
    }
  }

  applyTileEffects(state, combatant.id, chain);
  return true;
}

function phaseMoveDestination(
  state: CombatState,
  combatant: CombatantState,
  destination: Position
): { destination: Position; phased: boolean } | null {
  const dx = destination.x - combatant.position.x;
  const dy = destination.y - combatant.position.y;
  const straight = (Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0);

  if (!straight) {
    return null;
  }

  const directTile = tileAt(state.tiles, destination);

  if (
    directTile &&
    directTile.kind !== "wall" &&
    !getCorpseAt(state, destination)?.blocksMovement &&
    !findOccupantAt(state, destination)
  ) {
    return {
      destination,
      phased: false
    };
  }

  const canPhase =
    hasRule(state, combatant, "phase-walk") &&
    (!combatant.flags.phaseWalkUsed || !combatant.isPlayer);

  if (!canPhase || directTile?.kind !== "wall") {
    return null;
  }

  const beyond = {
    x: destination.x + dx,
    y: destination.y + dy
  };

  if (isBlocked(state, beyond)) {
    return null;
  }

  return {
    destination: beyond,
    phased: true
  };
}

function canUseLineDash(state: CombatState, combatant: CombatantState): boolean {
  return (
    combatant.isPlayer &&
    hasRule(state, combatant, "line-dash") &&
    combatant.flags.lineDashReady
  );
}

export function getMoveTargets(state: CombatState, combatantId = "player"): Position[] {
  const combatant = getCombatantById(state, combatantId);

  if (!combatant || !combatant.alive) {
    return [];
  }

  const baseTargets = orthogonalNeighbors(combatant.position)
    .map((position) => phaseMoveDestination(state, combatant, position))
    .filter((entry): entry is { destination: Position; phased: boolean } => Boolean(entry))
    .map((entry) => entry.destination);

  if (!canUseLineDash(state, combatant)) {
    return baseTargets;
  }

  const dashTargets: Position[] = [];

  [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ].forEach((vector) => {
    const mid = {
      x: combatant.position.x + vector.x,
      y: combatant.position.y + vector.y
    };
    const target = {
      x: combatant.position.x + vector.x * 2,
      y: combatant.position.y + vector.y * 2
    };

    if (!isBlocked(state, mid) && !isBlocked(state, target)) {
      dashTargets.push(target);
    }
  });

  return [...baseTargets, ...dashTargets].filter(
    (position, index, array) =>
      array.findIndex((entry) => samePosition(entry, position)) === index
  );
}

export function getAttackTargets(state: CombatState, combatantId = "player"): CombatantState[] {
  const combatant = getCombatantById(state, combatantId);

  if (!combatant || !combatant.alive) {
    return [];
  }

  return orthogonalNeighbors(combatant.position)
    .map((position) => findOccupantAt(state, position))
    .filter(
      (target): target is CombatantState =>
        Boolean(target && target.team !== combatant.team && target.alive)
    );
}

function reduceCooldownAtRoundStart(tool: ToolRuntime): void {
  tool.usedThisRound = false;

  if (tool.cooldown > 0) {
    tool.cooldown -= 1;
  }
}

function chooseSlotToSeal(state: CombatState): keyof RuleLoadout | null {
  for (const slot of SLOT_ORDER) {
    if (slot === "state" && !state.stateSlotUnlocked) {
      continue;
    }

    if (state.equippedRules[slot] && state.sealedSlots[slot] === 0) {
      return slot;
    }
  }

  return null;
}

function slotLabel(slot: keyof RuleLoadout): string {
  switch (slot) {
    case "movement":
      return "이동";
    case "combat":
      return "교전";
    case "state":
      return "상태";
    case "termination":
      return "종결";
    default:
      return slot;
  }
}

function sealSlot(state: CombatState, slot: keyof RuleLoadout, rounds: number): void {
  state.sealedSlots[slot] = Math.max(state.sealedSlots[slot], rounds);
  addLog(state, `${slotLabel(slot)} 슬롯이 ${rounds}라운드 동안 봉인되었다.`, "danger");
}

function updateBossPhase(state: CombatState): void {
  const boss = state.enemies.find(
    (enemy) => enemy.templateId === "dungeon-administrator" && enemy.alive
  );

  if (!boss) {
    return;
  }

  const nextPhase = boss.hp > 8 ? 1 : boss.hp > 4 ? 2 : 3;

  if (boss.flags.bossPhase === nextPhase) {
    return;
  }

  boss.flags.bossPhase = nextPhase;

  if (nextPhase === 2) {
    const mirrored = getPlayerRuleIds(state)[0] ?? "frontal-counter";
    boss.flags.mirroredRuleId = mirrored;
    addLog(
      state,
      `보스 위상 전환 | 거울 위상에서 ${getRule(mirrored)?.koreanName ?? "규칙"}을 복제했다.`,
      "magenta"
    );
  } else if (nextPhase === 3) {
    addLog(state, "보스 위상 전환 | 집행 단계가 시작되었다.", "danger");
  }
}

function applyRoundStartRuleLogic(state: CombatState, combatant: CombatantState): void {
  if (!combatant.alive) {
    return;
  }

  if (hasRule(state, combatant, "clock-surge") && state.round % 3 === 0) {
    combatant.flags.extraActionReady = true;

    if (combatant.isPlayer) {
      state.remainingCommands += 1;
      addLog(state, "시계중첩 | 이번 라운드 명령이 1회 추가되었다.", "acid");
    } else {
      addLog(state, `${combatant.koreanName}이(가) 추가 행동을 준비한다.`, "danger");
      maybeMarkTheftFromEvent(state, combatant.id, "extra-action-round");
    }
  }

  if (hasRule(state, combatant, "rule-censor")) {
    if (combatant.isPlayer) {
      state.enemies.forEach((enemy) => {
        if (enemy.alive && manhattanDistance(enemy.position, combatant.position) === 1) {
          addStatusToCombatant(state, enemy.id, "silence", 1, combatant.id, createChain(state));
        }
      });
    } else if (manhattanDistance(combatant.position, state.player.position) <= 1) {
      const slot = chooseSlotToSeal(state);

      if (slot) {
        sealSlot(state, slot, 2);
      }
    }
  }

  if (combatant.templateId === "mirror-witch" && combatant.alive) {
    const mirrored = getPlayerRuleIds(state)[1] ?? getPlayerRuleIds(state)[0] ?? null;

    if (mirrored) {
      combatant.flags.mirroredRuleId = mirrored;
      addLog(state, `거울 마녀가 ${getRule(mirrored)?.koreanName ?? mirrored}을 흉내 낸다.`, "magenta");
    }
  }

  if (combatant.templateId === "dungeon-administrator" && combatant.alive) {
    updateBossPhase(state);

    if (combatant.flags.bossPhase === 1) {
      const slot = chooseSlotToSeal(state);

      if (slot) {
        sealSlot(state, slot, 1);
      }
    } else if (combatant.flags.bossPhase === 2) {
      const mirrored = getPlayerRuleIds(state)[0] ?? "frontal-counter";
      combatant.flags.mirroredRuleId = mirrored;
    } else if (combatant.flags.bossPhase === 3) {
      addLog(state, "집행 프로토콜 | 전장 오브젝트가 관리자 편으로 재해석된다.", "danger");
    }
  }
}

function decrementStatusDurations(combatant: CombatantState): void {
  combatant.statuses = combatant.statuses
    .map((status) => {
      if (status.id === "guard") {
        return status;
      }

      return {
        ...status,
        duration: status.duration - 1
      };
    })
    .filter((status) => status.duration > 0 || status.id === "guard");
}

function beginRound(state: CombatState, initial = false): void {
  if (!initial) {
    state.round += 1;
  }

  state.playerTurn = true;
  state.remainingCommands = 1;
  state.availableBonusMoves = 0;
  state.scanAvailable = true;
  state.selectedEnemyId = null;

  Object.values(state.tools).forEach(reduceCooldownAtRoundStart);

  if (!initial) {
    state.corpses = state.corpses
      .map((corpse) => ({
        ...corpse,
        duration: corpse.duration - 1
      }))
      .filter((corpse) => corpse.duration > 0);

    SLOT_ORDER.forEach((slot) => {
      state.sealedSlots[slot] = Math.max(0, state.sealedSlots[slot] - 1);
    });
  }

  [state.player, ...state.enemies].forEach((combatant) => {
    combatant.flags.movedThisRound = false;
    combatant.flags.frontalCounterUsed = false;
    combatant.flags.recentShoveCollision = false;
    combatant.flags.extraActionReady = false;

    if (combatant.signatureDisabledRounds > 0 && !initial) {
      combatant.signatureDisabledRounds -= 1;
    }

    if (combatant.flags.copiedTurnsRemaining > 0) {
      combatant.flags.copiedTurnsRemaining -= 1;

      if (combatant.flags.copiedTurnsRemaining <= 0) {
        combatant.flags.copiedToolId = null;
      }
    }
  });

  addLog(state, `라운드 ${state.round} 시작`, "cyan");
  applyRoundStartRuleLogic(state, state.player);
  state.enemies.forEach((enemy) => applyRoundStartRuleLogic(state, enemy));
  updateIntents(state);
}

function finishRound(state: CombatState): void {
  [state.player, ...state.enemies].forEach((combatant) => {
    if (!combatant.alive) {
      return;
    }

    const poison = combatant.statuses.find((status) => status.id === "poison");
    const regen = combatant.statuses.find((status) => status.id === "regen");

    if (poison) {
      applyDamage(
        state,
        combatant.id,
        1,
        {
          sourceId: poison.sourceId ?? null,
          type: "poison",
          melee: false
        },
        createChain(state),
        false
      );
    }

    if (regen && combatant.alive) {
      healCombatant(state, combatant.id, 1);
      addLog(state, `${combatant.koreanName}이(가) 재생으로 1 회복했다.`, "acid");
    }

    decrementStatusDurations(combatant);
  });

  if (!state.battleWon && !state.battleLost) {
    beginRound(state);
  }
}

function endPlayerTurn(state: CombatState): void {
  if (state.battleWon || state.battleLost) {
    return;
  }

  state.playerTurn = false;
  state.availableBonusMoves = 0;
  enemyPhase(state);

  if (!state.battleWon && !state.battleLost) {
    finishRound(state);
  }
}

function applyAttackOnHitRules(
  state: CombatState,
  attacker: CombatantState,
  target: CombatantState,
  chain: ChainContext
): void {
  if (hasRule(state, attacker, "silencing-strike") && !attacker.flags.silencingStrikeUsed) {
    const nextChain = markRuleTriggered(state, chain, attacker.id, "silencing-strike", chain.depth + 1);

    if (nextChain) {
      attacker.flags.silencingStrikeUsed = true;
      addStatusToCombatant(state, target.id, "silence", 1, attacker.id, nextChain, nextChain.depth);
      addLog(state, `${attacker.koreanName}의 절단타가 침묵을 남겼다.`, "magenta");
    }
  }

  if (hasRule(state, attacker, "cleansing-hit")) {
    const nextChain = markRuleTriggered(state, chain, attacker.id, "cleansing-hit", chain.depth + 1);

    if (nextChain) {
      const debuff = attacker.statuses.find((status) => status.negative);

      if (debuff) {
        removeStatus(attacker, debuff.id);
        addLog(state, `${attacker.koreanName}이(가) 정화타로 약화를 제거했다.`, "acid");
      }
    }
  }

  if (hasRule(state, attacker, "position-swap")) {
    const nextChain = markRuleTriggered(state, chain, attacker.id, "position-swap", chain.depth + 1);

    if (nextChain) {
      const attackerPosition = cloneValue(attacker.position);
      attacker.position = cloneValue(target.position);
      target.position = attackerPosition;
      addLog(state, `${attacker.koreanName}이(가) 위치를 뒤바꿨다.`, "cyan");
    }
  }

  if (hasRule(state, attacker, "hook-strike")) {
    const nextChain = markRuleTriggered(state, chain, attacker.id, "hook-strike", chain.depth + 1);

    if (nextChain) {
      const dx = attacker.position.x - target.position.x;
      const dy = attacker.position.y - target.position.y;
      const pulled = {
        x: target.position.x + Math.sign(dx),
        y: target.position.y + Math.sign(dy)
      };

      if (!isBlocked(state, pulled) && !samePosition(pulled, attacker.position)) {
        target.position = pulled;
        addLog(state, `${target.koreanName}이(가) 훅타격에 끌려왔다.`, "cyan");
      }
    }
  }

  if (attacker.isPlayer && hasRule(state, attacker, "afterstrike-step")) {
    const nextChain = markRuleTriggered(state, chain, attacker.id, "afterstrike-step", chain.depth + 1);

    if (nextChain) {
      state.availableBonusMoves += state.activeRecipeIds.includes("backdoor") ? 2 : 1;
      addLog(state, "후공이동 | 추가 이동 기회가 생겼다.", "acid");
    }
  }
}

function performAttack(state: CombatState, attackerId: string, targetId: string): boolean {
  const attacker = getCombatantById(state, attackerId);
  const target = getCombatantById(state, targetId);

  if (!attacker || !target || !attacker.alive || !target.alive) {
    return false;
  }

  if (manhattanDistance(attacker.position, target.position) !== 1) {
    return false;
  }

  const chain = createChain(state);
  attacker.facing = directionFromTo(attacker.position, target.position) ?? attacker.facing;
  attacker.flags.directAttackCount += 1;
  addLog(state, `${attacker.koreanName}이(가) ${target.koreanName}을(를) 공격했다.`, "cyan");

  applyDamage(
    state,
    target.id,
    attacker.damage,
    {
      sourceId: attacker.id,
      type: "attack",
      melee: true
    },
    chain,
    true
  );

  if (target.alive) {
    applyAttackOnHitRules(state, attacker, target, chain);
  }

  if (attacker.isPlayer && state.availableBonusMoves <= 0) {
    attacker.flags.lineCharge = 0;
    attacker.flags.lineDashReady = false;
  }

  updateBossPhase(state);
  updateIntents(state);
  return true;
}

function performMove(state: CombatState, combatantId: string, destination: Position): boolean {
  const combatant = getCombatantById(state, combatantId);

  if (!combatant || !combatant.alive) {
    return false;
  }

  const validTargets = getMoveTargets(state, combatantId);

  if (!validTargets.some((position) => samePosition(position, destination))) {
    return false;
  }

  const adjacentAttempt = orthogonalNeighbors(combatant.position).find((position) =>
    samePosition(position, destination) ||
    samePosition(
      {
        x: position.x + (position.x - combatant.position.x),
        y: position.y + (position.y - combatant.position.y)
      },
      destination
    )
  );

  const phaseAttempt =
    adjacentAttempt && phaseMoveDestination(state, combatant, adjacentAttempt);
  const phased = Boolean(
    phaseAttempt &&
      samePosition(phaseAttempt.destination, destination) &&
      phaseAttempt.phased
  );

  if (phased && combatant.isPlayer) {
    combatant.flags.phaseWalkUsed = true;
    maybeMarkTheftFromEvent(state, combatantId, "phase-adjacent-wall");
  }

  if (!moveCombatantTo(state, combatantId, destination, createChain(state), phased)) {
    return false;
  }

  if (combatant.isPlayer && hasRule(state, combatant, "line-dash")) {
    if (manhattanDistance(state.player.position, destination) >= 2) {
      combatant.flags.lineDashReady = false;
      combatant.flags.lineCharge = 0;
    } else if (combatant.flags.lineCharge >= 2) {
      combatant.flags.lineDashReady = true;
    }
  }

  updateIntents(state);
  return true;
}

function directAdjacentEnemy(state: CombatState, source: CombatantState): CombatantState | null {
  return (
    getAttackTargets(state, source.id).sort(
      (left, right) =>
        left.hp - right.hp ||
        positionKey(left.position).localeCompare(positionKey(right.position))
    )[0] ?? null
  );
}

function moveTowardPlayer(state: CombatState, enemy: CombatantState): void {
  const candidates = getMoveTargets(state, enemy.id).sort((left, right) => {
    const leftDistance = manhattanDistance(left, state.player.position);
    const rightDistance = manhattanDistance(right, state.player.position);
    return leftDistance - rightDistance || positionKey(left).localeCompare(positionKey(right));
  });

  const best = candidates[0];

  if (best) {
    performMove(state, enemy.id, best);

    if (enemy.templateId === "wraith") {
      maybeMarkTheftFromEvent(state, enemy.id, "phase-adjacent-wall");
    }
  }
}

function mirrorToolAction(state: CombatState, enemy: CombatantState): boolean {
  const toolId = enemy.flags.copiedToolId;

  if (!toolId) {
    return false;
  }

  if (toolId === "shove" && manhattanDistance(enemy.position, state.player.position) === 1) {
    const dx = state.player.position.x - enemy.position.x;
    const dy = state.player.position.y - enemy.position.y;
    const destination = {
      x: state.player.position.x + dx,
      y: state.player.position.y + dy
    };

    if (!isBlocked(state, destination)) {
      moveCombatantTo(state, state.player.id, destination, createChain(state), false);
      addLog(state, "거울 인형이 밀치기를 모방했다.", "magenta");
      return true;
    }
  }

  if (toolId === "sever" && manhattanDistance(enemy.position, state.player.position) <= 3) {
    state.player.signatureDisabledRounds = Math.max(state.player.signatureDisabledRounds, 1);
    addStatusToCombatant(state, "player", "silence", 1, enemy.id, createChain(state));
    addLog(state, "거울 인형이 절단을 모방했다.", "danger");
    return true;
  }

  if (toolId === "wait" || toolId === "scan") {
    addStatusToCombatant(state, enemy.id, "guard", 1, enemy.id, createChain(state));
    addLog(state, "거울 인형이 방어 자세를 흉내 냈다.", "acid");
    return true;
  }

  return false;
}

function enemyAction(state: CombatState, enemy: CombatantState): void {
  if (!enemy.alive || state.battleLost || state.battleWon) {
    return;
  }

  updateBossPhase(state);

  if (enemy.templateId === "mirror-doll" && mirrorToolAction(state, enemy)) {
    return;
  }

  const adjacent = directAdjacentEnemy(state, enemy);

  if (adjacent) {
    performAttack(state, enemy.id, adjacent.id);
    return;
  }

  moveTowardPlayer(state, enemy);

  if (enemy.templateId === "bomb-beetle" && manhattanDistance(enemy.position, state.player.position) === 1) {
    performAttack(state, enemy.id, state.player.id);
  }
}

function enemyPhase(state: CombatState): void {
  const actingEnemies = state.enemies.filter((enemy) => enemy.alive);

  for (const enemy of actingEnemies) {
    enemyAction(state, enemy);

    if (state.battleLost || state.battleWon) {
      break;
    }

    if (enemy.flags.extraActionReady) {
      enemy.flags.extraActionReady = false;
      enemyAction(state, enemy);

      if (state.battleLost || state.battleWon) {
        break;
      }
    }
  }
}

function conditionLabel(enemy: CombatantState): string {
  switch (enemy.theftConditionId) {
    case "watch-counter":
      return "반격을 한 번 유도한 뒤 처치";
    case "indirect-kill":
      return "간접 피해를 한 번 입힌 뒤 처치";
    case "phase-adjacent-wall":
      return "벽 통과 또는 벽 인접 위상 이동 후 처치";
    case "shove-collision":
      return "밀치기로 전장 충돌을 만든 뒤 처치";
    case "copied-then-kill":
      return "도구 복사 후 짧은 시간 안에 처치";
    case "sealed-slot-kill":
      return "규칙 슬롯 봉인 상태에서 처치";
    case "extra-action-round":
      return "추가 행동 라운드에 마크 후 처치";
    case "elite-victory":
      return "거울 마녀 격파";
    case "boss-victory":
      return "던전 관리자 격파";
    default:
      return "미확인";
  }
}

export function scanEnemy(state: CombatState, enemyId: string): CombatState {
  const nextState = cloneValue(state);

  if (!nextState.playerTurn || !nextState.scanAvailable) {
    return nextState;
  }

  const enemy = getCombatantById(nextState, enemyId);

  if (!enemy || enemy.isPlayer || !enemy.alive) {
    return nextState;
  }

  enemy.scanned = true;
  nextState.scanAvailable = false;
  nextState.selectedEnemyId = enemyId;
  addLog(
    nextState,
    `${enemy.koreanName} 스캔 완료 | ${getRule(enemy.signatureRuleId)?.koreanName ?? "규칙"} / ${conditionLabel(enemy)}`,
    "gold"
  );

  return nextState;
}

function useToolEcho(state: CombatState, toolId: ToolId): void {
  if (!hasRule(state, state.player, "copied-tool")) {
    return;
  }

  const tool = state.tools[toolId];

  if (tool.cooldown > 0) {
    tool.cooldown = Math.max(0, tool.cooldown - 1);
    addLog(state, `거울 복제 | ${tool.koreanName}의 냉각이 1 감소했다.`, "acid");
  }
}

function markMirrorDolls(state: CombatState, toolId: ToolId): void {
  state.enemies.forEach((enemy) => {
    if (enemy.alive && enemy.templateId === "mirror-doll") {
      enemy.flags.copiedToolId = toolId;
      enemy.flags.copiedTurnsRemaining = 2;
      maybeMarkTheftFromEvent(state, enemy.id, "copied-then-kill");
    }
  });
}

function useScan(state: CombatState, targetId: string): boolean {
  const scanned = scanEnemy(state, targetId);
  Object.assign(state, scanned);
  return true;
}

function useSever(state: CombatState, targetId: string): boolean {
  const target = getCombatantById(state, targetId);

  if (!target || target.isPlayer || !target.alive || state.tools.sever.cooldown > 0) {
    return false;
  }

  if (manhattanDistance(state.player.position, target.position) > 3) {
    return false;
  }

  target.signatureDisabledRounds = Math.max(target.signatureDisabledRounds, 1);
  addStatusToCombatant(state, target.id, "silence", 1, "player", createChain(state));
  state.tools.sever.cooldown = TOOL_LIBRARY.sever.maxCooldown;
  state.lastUsedToolId = "sever";
  useToolEcho(state, "sever");
  markMirrorDolls(state, "sever");
  addLog(state, `${target.koreanName}의 시그니처 규칙이 절단되었다.`, "magenta");
  return true;
}

function useShove(state: CombatState, targetId: string): boolean {
  const target = getCombatantById(state, targetId);

  if (!target || target.isPlayer || !target.alive || state.tools.shove.cooldown > 0) {
    return false;
  }

  if (manhattanDistance(state.player.position, target.position) !== 1) {
    return false;
  }

  const dx = target.position.x - state.player.position.x;
  const dy = target.position.y - state.player.position.y;
  const destination = {
    x: target.position.x + dx,
    y: target.position.y + dy
  };

  state.tools.shove.cooldown = TOOL_LIBRARY.shove.maxCooldown;
  state.lastUsedToolId = "shove";
  useToolEcho(state, "shove");
  markMirrorDolls(state, "shove");

  if (!isInsideBoard(destination) || tileKind(state, destination) === "wall") {
    target.flags.recentShoveCollision = true;
    maybeMarkTheftFromEvent(state, target.id, "shove-collision");
    addLog(state, `${target.koreanName}이(가) 벽면에 밀려 충돌했다.`, "danger");
    return true;
  }

  if (findOccupantAt(state, destination) || getCorpseAt(state, destination)?.blocksMovement) {
    target.flags.recentShoveCollision = true;
    maybeMarkTheftFromEvent(state, target.id, "shove-collision");
    addLog(state, `${target.koreanName}이(가) 장애물에 걸렸다.`, "danger");
    return true;
  }

  moveCombatantTo(state, target.id, destination, createChain(state), false);

  if (tileKind(state, destination) === "hazard") {
    target.flags.recentShoveCollision = true;
    maybeMarkTheftFromEvent(state, target.id, "shove-collision");
  }

  return true;
}

function useWait(state: CombatState): boolean {
  const chain = createChain(state);
  state.lastUsedToolId = "wait";
  markMirrorDolls(state, "wait");

  if (hasRule(state, state.player, "guarded-wait")) {
    const nextChain = markRuleTriggered(state, chain, "player", "guarded-wait", chain.depth + 1);

    if (nextChain) {
      addStatusToCombatant(state, "player", "guard", 1, "player", nextChain);
    }
  }

  if (state.activeRecipeIds.includes("static-cycle") && hasStatus(state.player, "poison")) {
    addStatusToCombatant(state, "player", "regen", 1, "player", chain);
    addStatusToCombatant(state, "player", "guard", 1, "player", chain);
    addLog(state, "패치 적용 | 정적 순환이 즉시 발동했다.", "acid");
  }

  return true;
}

function consumePlayerCommand(state: CombatState, action: PlayerCommand): void {
  if (action.type === "move" && state.availableBonusMoves > 0 && state.remainingCommands <= 0) {
    state.availableBonusMoves -= 1;
    return;
  }

  state.remainingCommands = Math.max(0, state.remainingCommands - 1);
}

function finalizePlayerAction(state: CombatState, action: PlayerCommand): void {
  if (state.battleWon || state.battleLost) {
    return;
  }

  if (action.type === "move" && state.remainingCommands === 0 && state.availableBonusMoves > 0) {
    return;
  }

  if (action.type === "attack" && state.availableBonusMoves > 0) {
    state.remainingCommands = 0;
    return;
  }

  if (action.type === "scan") {
    return;
  }

  if (state.remainingCommands <= 0 && state.availableBonusMoves <= 0) {
    endPlayerTurn(state);
  }
}

export function performPlayerCommand(state: CombatState, command: PlayerCommand): CombatState {
  const nextState = cloneValue(state);

  if (!nextState.playerTurn || nextState.battleWon || nextState.battleLost) {
    return nextState;
  }

  let success = false;

  if (command.type === "scan" && command.targetId) {
    success = useScan(nextState, command.targetId);
  } else if (command.type === "move" && command.position) {
    success = performMove(nextState, "player", command.position);
  } else if (command.type === "attack" && command.targetId) {
    success = performAttack(nextState, "player", command.targetId);
  } else if (command.type === "sever" && command.targetId) {
    success = useSever(nextState, command.targetId);
  } else if (command.type === "shove" && command.targetId) {
    success = useShove(nextState, command.targetId);
  } else if (command.type === "wait") {
    success = useWait(nextState);
  }

  if (!success) {
    return nextState;
  }

  if (command.type !== "scan") {
    consumePlayerCommand(nextState, command);
  }

  finalizePlayerAction(nextState, command);
  updateIntents(nextState);
  return nextState;
}

function computeIntentForEnemy(state: CombatState, enemy: CombatantState): IntentInfo | null {
  if (!enemy.alive) {
    return null;
  }

  const adjacent = manhattanDistance(enemy.position, state.player.position) === 1;

  if (enemy.flags.extraActionReady) {
    return {
      label: "추가 행동",
      detail: "이번 라운드에 한 번 더 행동한다.",
      threatenedTiles: [cloneValue(state.player.position)]
    };
  }

  if (enemy.templateId === "censor-eye" && manhattanDistance(enemy.position, state.player.position) <= 1) {
    return {
      label: "봉인 시선",
      detail: "가까이 있으면 규칙 슬롯 하나를 봉인한다.",
      threatenedTiles: [cloneValue(state.player.position)]
    };
  }

  if (enemy.templateId === "watch-knight" && adjacent) {
    return {
      label: "정면 반격",
      detail: "인접 적을 공격하고 정면 공격에 반격한다.",
      threatenedTiles: [cloneValue(state.player.position)]
    };
  }

  if (adjacent) {
    return {
      label: "근접 공격",
      detail: "인접 대상을 공격한다.",
      threatenedTiles: [cloneValue(state.player.position)]
    };
  }

  const step = getMoveTargets(state, enemy.id)[0];

  return {
    label: "접근",
    detail: enemy.templateId === "wraith" ? "벽을 무시하고 접근한다." : "플레이어에게 접근한다.",
    threatenedTiles: step ? [step] : []
  };
}

export function updateIntents(state: CombatState): void {
  state.enemies.forEach((enemy) => {
    enemy.intent = computeIntentForEnemy(state, enemy);
  });
}

export function initializeCombatState(state: CombatState): CombatState {
  const nextState = cloneValue(state);
  beginRound(nextState, true);
  return nextState;
}

export function getEnemyInfo(state: CombatState, enemyId: string | null): CombatantState | null {
  if (!enemyId) {
    return null;
  }

  return getCombatantById(state, enemyId) ?? null;
}

export function addRuleToBackpack(
  state: { backpackRules: string[]; equippedRules: RuleLoadout },
  ruleId: string
): { backpackRules: string[]; equippedRules: RuleLoadout } {
  const owned = new Set(
    state.backpackRules.concat(
      SLOT_ORDER.flatMap((slot) => (state.equippedRules[slot] ? [state.equippedRules[slot] as string] : []))
    )
  );

  if (owned.has(ruleId)) {
    return {
      backpackRules: state.backpackRules,
      equippedRules: state.equippedRules
    };
  }

  return {
    backpackRules: [...state.backpackRules, ruleId].slice(-5),
    equippedRules: state.equippedRules
  };
}

export function equipRule(
  loadout: RuleLoadout,
  backpackRules: string[],
  ruleId: string
): { loadout: RuleLoadout; backpackRules: string[] } {
  const rule = getRule(ruleId);

  if (!rule) {
    return {
      loadout,
      backpackRules
    };
  }

  const slot = rule.category as keyof RuleLoadout;
  const previous = loadout[slot];
  const nextBackpack = backpackRules.filter((entry) => entry !== ruleId);

  if (previous) {
    nextBackpack.push(previous);
  }

  return {
    loadout: {
      ...loadout,
      [slot]: ruleId
    },
    backpackRules: nextBackpack.slice(-5)
  };
}

export function unequipRule(
  loadout: RuleLoadout,
  backpackRules: string[],
  slot: keyof RuleLoadout
): { loadout: RuleLoadout; backpackRules: string[] } {
  const current = loadout[slot];

  if (!current) {
    return {
      loadout,
      backpackRules
    };
  }

  return {
    loadout: {
      ...loadout,
      [slot]: null
    },
    backpackRules: [...backpackRules, current].slice(-5)
  };
}

export function getRuleTooltip(ruleId: string | null): string {
  const rule = getRule(ruleId);

  if (!rule) {
    return "비어 있는 슬롯";
  }

  return `${rule.koreanName} | ${rule.description}`;
}

export function getRuleCategoryLabel(category: RuleCategory): string {
  switch (category) {
    case "movement":
      return "이동";
    case "combat":
      return "교전";
    case "state":
      return "상태";
    case "termination":
      return "종결";
    default:
      return category;
  }
}

export function getRuleDefinition(ruleId: string): RuleDefinition | null {
  return getRule(ruleId);
}

export function getAvailableActionTargets(
  state: CombatState,
  mode: ActionMode
): Array<Position | CombatantState> {
  if (mode === "move") {
    return getMoveTargets(state);
  }

  if (mode === "attack" || mode === "sever" || mode === "shove" || mode === "scan") {
    return state.enemies.filter((enemy) => enemy.alive);
  }

  return [];
}

export function getOwnedRuleIds(loadout: RuleLoadout, backpackRules: string[]): string[] {
  return SLOT_ORDER.flatMap((slot) => (loadout[slot] ? [loadout[slot] as string] : [])).concat(backpackRules);
}
