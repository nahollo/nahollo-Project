import { CHARACTERS } from "../data/characters";
import { NodeInstance, RuleCategory, RunState } from "../engine/types";
import { SeededRng } from "../utils/rng";

function createNode(
  id: string,
  type: NodeInstance["type"],
  title: string,
  description: string,
  column: number,
  row: number,
  nextIds: string[],
  encounterId?: string
): NodeInstance {
  return {
    id,
    type,
    title,
    description,
    column,
    row,
    nextIds,
    encounterId,
    cleared: false,
    available: false
  };
}

export function createNodeMap(seed: number): NodeInstance[] {
  const rng = new SeededRng(seed);
  const earlyBattle = rng.pick(["rot-garden", "mirror-ward"]);
  const alternateBattle = earlyBattle === "rot-garden" ? "mirror-ward" : "rot-garden";
  const lateBattle = rng.pick(["clock-foundry", "mirror-ward"]);

  const nodes: NodeInstance[] = [
    createNode(
      "n1",
      "battle",
      "보관층 입구",
      "낡은 규칙이 쌓인 입구층이다. 첫 탈취를 배우는 전장.",
      1,
      2,
      ["n2", "n3"],
      "archive-gate"
    ),
    createNode(
      "n2",
      "battle",
      "초기 교전 A",
      "간접 처치와 종결 규칙을 시험하는 방.",
      2,
      1,
      ["n4", "n5"],
      earlyBattle
    ),
    createNode(
      "n3",
      "battle",
      "초기 교전 B",
      "복사와 벽 통과를 익히는 회랑.",
      2,
      3,
      ["n4", "n5"],
      alternateBattle
    ),
    createNode(
      "n4",
      "rest",
      "휴식실",
      "손상된 프로세스를 잠시 정돈하고 체력을 복구한다.",
      3,
      1,
      ["n6"]
    ),
    createNode(
      "n5",
      "lab",
      "실험실",
      "탈취한 규칙을 재배치하고 패치를 점검한다.",
      3,
      3,
      ["n6"]
    ),
    createNode(
      "n6",
      "battle",
      "중간 교전",
      "감사 신호가 짙어지는 중층부 전장.",
      4,
      2,
      ["n7"],
      "clock-foundry"
    ),
    createNode(
      "n7",
      "elite",
      "거울 마녀",
      "당신이 만든 빌드를 되비추는 거울 결투.",
      5,
      2,
      ["n8", "n9"],
      "mirror-witch-duel"
    ),
    createNode(
      "n8",
      "rest",
      "정비실",
      "관리자 코어 진입 전 마지막 안정 구간.",
      6,
      1,
      ["n10"]
    ),
    createNode(
      "n9",
      "lab",
      "패치 실험실",
      "보스전을 앞두고 규칙 슬롯을 최종 조정한다.",
      6,
      3,
      ["n10"]
    ),
    createNode(
      "n10",
      "battle",
      "말단 감사층",
      "강화된 감사 열 속에서 마지막 실전 검증을 치른다.",
      7,
      2,
      ["n11"],
      lateBattle
    ),
    createNode(
      "n11",
      "boss",
      "관리자 코어",
      "훔쳐 온 법칙이 되돌아오는 최종 감사.",
      8,
      2,
      [],
      "administrator-core"
    )
  ];

  return nodes.map((node) =>
    node.id === "n1"
      ? {
          ...node,
          available: true
        }
      : node
  );
}

export function createRun(characterId: string, seed = Date.now()): RunState {
  const character =
    CHARACTERS.find((entry) => entry.id === characterId) ?? CHARACTERS[0];

  return {
    seed,
    characterId: character.id,
    playerHp: character.maxHp,
    maxHp: character.maxHp,
    auditHeat: 0,
    unlockedStateSlot: false,
    nodeMap: createNodeMap(seed),
    currentNodeId: null,
    currentCombat: null,
    equippedRules: {
      movement: character.startingRules.movement ?? null,
      combat: character.startingRules.combat ?? null,
      state: character.startingRules.state ?? null,
      termination: character.startingRules.termination ?? null
    },
    backpackRules: ["guarded-wait", "position-swap", "corpse-burst"],
    battleHistoryCategories: [],
    recipeHistory: []
  };
}

export function getNodeById(run: RunState, nodeId: string): NodeInstance | undefined {
  return run.nodeMap.find((node) => node.id === nodeId);
}

export function markNodeCleared(run: RunState, nodeId: string): RunState {
  const clearedNode = getNodeById(run, nodeId);

  if (!clearedNode) {
    return run;
  }

  const nextIdSet = new Set(clearedNode.nextIds);

  return {
    ...run,
    nodeMap: run.nodeMap.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          cleared: true,
          available: false
        };
      }

      if (nextIdSet.has(node.id)) {
        return {
          ...node,
          available: true
        };
      }

      return node;
    }),
    currentNodeId: nodeId
  };
}

export function dominantRuleCategory(run: RunState): RuleCategory {
  const counts: Record<RuleCategory, number> = {
    movement: 0,
    combat: 0,
    state: 0,
    termination: 0
  };

  if (run.equippedRules.movement) {
    counts.movement += 1;
  }

  if (run.equippedRules.combat) {
    counts.combat += 1;
  }

  if (run.equippedRules.state) {
    counts.state += 1;
  }

  if (run.equippedRules.termination) {
    counts.termination += 1;
  }

  return (Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "combat") as RuleCategory;
}

export function updateAuditHeat(run: RunState, activeRecipeIds: string[]): RunState {
  const dominantCategory = dominantRuleCategory(run);
  const nextBattleHistory = [...run.battleHistoryCategories, dominantCategory].slice(-3);
  const repeatedCategory =
    nextBattleHistory.length >= 3 &&
    new Set(nextBattleHistory).size === 1;

  const strongestRecipe = activeRecipeIds[0] ?? null;
  const nextRecipeHistory = strongestRecipe
    ? [...run.recipeHistory, strongestRecipe].slice(-3)
    : run.recipeHistory.slice(-3);
  const repeatedRecipe =
    nextRecipeHistory.length >= 2 &&
    nextRecipeHistory[nextRecipeHistory.length - 1] ===
      nextRecipeHistory[nextRecipeHistory.length - 2];

  const nextAuditHeat = Math.min(
    3,
    Math.max(0, run.auditHeat + (repeatedCategory ? 1 : 0) + (repeatedRecipe ? 1 : 0))
  );

  return {
    ...run,
    auditHeat: nextAuditHeat,
    battleHistoryCategories: nextBattleHistory,
    recipeHistory: nextRecipeHistory
  };
}
