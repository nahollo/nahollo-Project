export type RuleCategory = "movement" | "combat" | "state" | "termination";
export type RuleRarity = "common" | "rare" | "elite" | "boss";
export type HookName =
  | "onRoundStart"
  | "onActionDeclare"
  | "onMove"
  | "onAttack"
  | "onReceiveStatus"
  | "onReceiveDamage"
  | "onDeath"
  | "onRoundEnd";
export type ToolId = "scan" | "sever" | "shove" | "wait" | "overwrite";
export type StatusId =
  | "guard"
  | "poison"
  | "regen"
  | "fragile"
  | "silence"
  | "phase";
export type NodeType = "battle" | "rest" | "lab" | "elite" | "boss";
export type Facing = "up" | "down" | "left" | "right";
export type Team = "player" | "enemy";
export type BehaviorId =
  | "watchKnight"
  | "slimeMass"
  | "wraith"
  | "bombBeetle"
  | "mirrorDoll"
  | "censorEye"
  | "clockSoldier"
  | "auditDrone"
  | "mirrorWitch"
  | "dungeonAdministrator";
export type TileKind = "floor" | "wall" | "hazard" | "console";
export type ScreenId =
  | "menu"
  | "nodeMap"
  | "combat"
  | "rest"
  | "lab"
  | "reward"
  | "codex"
  | "settings"
  | "credits"
  | "summary";
export type ActionMode =
  | "move"
  | "attack"
  | "scan"
  | "sever"
  | "shove"
  | "wait"
  | "interact"
  | null;

export interface Position {
  x: number;
  y: number;
}

export interface StatusInstance {
  id: StatusId;
  duration: number;
  negative: boolean;
  sourceId?: string | null;
}

export interface RuleDefinition {
  id: string;
  koreanName: string;
  englishName: string;
  category: RuleCategory;
  rarity: RuleRarity;
  description: string;
  keywords: string[];
  hooks: HookName[];
  signatureFromEnemyId?: string;
}

export interface RecipeDefinition {
  id: string;
  koreanName: string;
  englishName: string;
  requiredRuleIds: string[];
  description: string;
}

export interface EnemyDefinition {
  id: string;
  koreanName: string;
  englishName: string;
  maxHp: number;
  damage: number;
  color: string;
  signatureRuleId: string;
  theftConditionId: string;
  behavior: BehaviorId;
  role: string;
  elite?: boolean;
  boss?: boolean;
}

export interface CharacterDefinition {
  id: string;
  koreanName: string;
  description: string;
  maxHp: number;
  startingRules: Partial<RuleLoadout>;
  startingTools: ToolId[];
  passiveText: string;
}

export interface RuleLoadout {
  movement: string | null;
  combat: string | null;
  state: string | null;
  termination: string | null;
}

export interface NodeInstance {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  column: number;
  row: number;
  nextIds: string[];
  encounterId?: string;
  cleared: boolean;
  available: boolean;
}

export interface IntentInfo {
  label: string;
  detail: string;
  threatenedTiles: Position[];
}

export interface CombatantFlags {
  movedThisRound: boolean;
  directAttackCount: number;
  lineCharge: number;
  lineDashReady: boolean;
  phaseWalkUsed: boolean;
  echoTile: Position | null;
  echoDodgeReady: boolean;
  frontalCounterUsed: boolean;
  silencingStrikeUsed: boolean;
  firstCurseMirrorUsed: boolean;
  executionCacheUsed: boolean;
  ghostCounterReady: boolean;
  copiedToolId: ToolId | null;
  copiedTurnsRemaining: number;
  extraActionReady: boolean;
  recentShoveCollision: boolean;
  mirroredRuleId: string | null;
  bossPhase: number;
}

export interface CombatantState {
  id: string;
  templateId: string;
  koreanName: string;
  hp: number;
  maxHp: number;
  damage: number;
  position: Position;
  facing: Facing;
  isPlayer: boolean;
  alive: boolean;
  statuses: StatusInstance[];
  signatureRuleId?: string;
  signatureDisabledRounds: number;
  theftConditionId?: string;
  theftMarked: boolean;
  theftSatisfied: boolean;
  scanned: boolean;
  intent: IntentInfo | null;
  team: Team;
  flags: CombatantFlags;
}

export interface ToolRuntime {
  id: ToolId;
  koreanName: string;
  englishName: string;
  cooldown: number;
  maxCooldown: number;
  oncePerRound: boolean;
  usedThisRound: boolean;
}

export interface TileState {
  position: Position;
  kind: TileKind;
  active: boolean;
}

export interface CorpseState {
  id: string;
  position: Position;
  duration: number;
  blocksMovement: boolean;
  hazardous: boolean;
  hazardConsumed: boolean;
}

export interface ShardState {
  id: string;
  position: Position;
  heal: number;
}

export interface LogEntry {
  id: string;
  round: number;
  text: string;
  accent?: "cyan" | "magenta" | "acid" | "danger" | "gold";
}

export interface RewardChoice {
  id: string;
  ruleId: string;
  sourceLabel: string;
}

export interface EncounterDefinition {
  id: string;
  type: "battle" | "elite" | "boss";
  koreanName: string;
  flavor: string;
  mapTemplate: string[];
  enemyIds: string[];
  enemyStarts: Position[];
  playerStart: Position;
}

export interface ChainContext {
  id: string;
  depth: number;
  triggeredRuleInstances: string[];
  limitReached: boolean;
}

export interface SealState {
  movement: number;
  combat: number;
  state: number;
  termination: number;
}

export interface CombatState {
  battleId: string;
  encounterId: string;
  encounterType: "battle" | "elite" | "boss";
  round: number;
  playerTurn: boolean;
  player: CombatantState;
  enemies: CombatantState[];
  tiles: TileState[];
  corpses: CorpseState[];
  shards: ShardState[];
  log: LogEntry[];
  tools: Record<ToolId, ToolRuntime>;
  equippedRules: RuleLoadout;
  backpackRules: string[];
  rewardChoices: RewardChoice[];
  activeRecipeIds: string[];
  discoveredRecipeIds: string[];
  scanAvailable: boolean;
  selectedEnemyId: string | null;
  remainingCommands: number;
  availableBonusMoves: number;
  stateSlotUnlocked: boolean;
  auditHeat: number;
  auditWarning: boolean;
  sealedSlots: SealState;
  nextChainId: number;
  battleWon: boolean;
  battleLost: boolean;
  victoryUnlockedRuleId: string | null;
  lastUsedToolId: ToolId | null;
}

export interface RunState {
  seed: number;
  characterId: string;
  playerHp: number;
  maxHp: number;
  auditHeat: number;
  unlockedStateSlot: boolean;
  nodeMap: NodeInstance[];
  currentNodeId: string | null;
  currentCombat: CombatState | null;
  equippedRules: RuleLoadout;
  backpackRules: string[];
  battleHistoryCategories: RuleCategory[];
  recipeHistory: string[];
}

export interface SettingsState {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  screenShake: boolean;
  highContrast: boolean;
  language: "kr";
}

export interface MetaProgress {
  discoveredRuleIds: string[];
  discoveredEnemyIds: string[];
  discoveredRecipeIds: string[];
  bestVictorySeed: number | null;
  lastRun: RunState | null;
  settings: SettingsState;
}
