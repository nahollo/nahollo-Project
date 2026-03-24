import { beforeEach, describe, expect, it } from "vitest";
import { createCombatState, getActiveRecipeIds, initializeCombatState, performPlayerCommand } from "../game/engine/combatEngine";
import { CombatState, RuleLoadout } from "../game/engine/types";
import { DEFAULT_META, SAVE_KEY, loadMetaProgress, saveMetaProgress } from "../game/save/storage";

function makeLoadout(overrides?: Partial<RuleLoadout>): RuleLoadout {
  return {
    movement: null,
    combat: null,
    state: null,
    termination: null,
    ...overrides
  };
}

function makeCombat(encounterId = "archive-gate", loadout?: Partial<RuleLoadout>): CombatState {
  return initializeCombatState(
    createCombatState(encounterId, {
      playerHp: 6,
      maxHp: 6,
      auditHeat: 0,
      equippedRules: makeLoadout(loadout),
      backpackRules: [],
      unlockedStateSlot: true
    })
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("규칙도둑 엔진", () => {
  it("반격 대 반격 상황에서 무한 루프에 빠지지 않는다", () => {
    const combat = makeCombat("archive-gate", {
      combat: "frontal-counter"
    });
    const knight = combat.enemies.find((enemy) => enemy.templateId === "watch-knight")!;
    combat.enemies = [knight];
    combat.player.position = { x: 4, y: 4 };
    combat.player.facing = "up";
    knight.position = { x: 4, y: 3 };
    knight.facing = "down";

    const next = performPlayerCommand(combat, {
      type: "attack",
      targetId: knight.id
    });

    expect(next.log.some((entry) => entry.text.includes("CHAIN LIMIT"))).toBe(false);
    expect(next.player.hp).toBeGreaterThan(0);
    expect(next.enemies[0].hp).toBeGreaterThan(0);
  });

  it("동일 규칙 인스턴스는 하나의 체인에서 한 번만 발동한다", () => {
    const combat = makeCombat("archive-gate", {
      termination: "corpse-burst"
    });
    const first = combat.enemies[0];
    const second = combat.enemies[1];
    const third = {
      ...structuredClone(combat.enemies[1]),
      id: "extra-target",
      hp: 1,
      maxHp: 1
    };
    combat.enemies = [first, second, third];
    combat.player.position = { x: 4, y: 4 };
    first.position = { x: 4, y: 3 };
    second.position = { x: 5, y: 3 };
    third.position = { x: 6, y: 3 };
    first.hp = 1;
    second.hp = 1;
    third.hp = 1;

    const next = performPlayerCommand(combat, {
      type: "attack",
      targetId: first.id
    });

    expect(next.enemies.find((enemy) => enemy.id === first.id)?.alive).toBe(false);
    expect(next.enemies.find((enemy) => enemy.id === second.id)?.alive).toBe(false);
    expect(next.enemies.find((enemy) => enemy.id === third.id)?.alive).toBe(true);
  });

  it("폭발 연쇄가 깊이 제한을 넘으면 안전하게 중단된다", () => {
    const combat = makeCombat("archive-gate");
    combat.tiles.forEach((tile) => {
      if (tile.kind === "wall") {
        tile.kind = "floor";
      }
    });

    combat.enemies = Array.from({ length: 9 }, (_, index) => {
      const template = combat.enemies[0];
      const x = index < 7 ? index + 1 : 7;
      const y = index < 7 ? 1 : index - 5;

      return {
        ...structuredClone(template),
        id: `bomb-${index}`,
        templateId: "bomb-beetle",
        koreanName: "폭뢰벌레",
        signatureRuleId: "corpse-burst",
        hp: 1,
        maxHp: 1,
        position: { x, y }
      };
    });
    combat.player.position = { x: 1, y: 2 };

    const next = performPlayerCommand(combat, {
      type: "attack",
      targetId: combat.enemies[0].id
    });

    expect(next.log.some((entry) => entry.text.includes("CHAIN LIMIT"))).toBe(true);
  });

  it("스캔 후 탈취 조건을 만족하면 탈취 마크가 생긴다", () => {
    const combat = makeCombat("archive-gate");
    const knight = combat.enemies.find((enemy) => enemy.templateId === "watch-knight")!;
    combat.enemies = [knight];
    combat.player.position = { x: 4, y: 4 };
    knight.position = { x: 4, y: 3 };
    knight.facing = "down";

    const scanned = performPlayerCommand(combat, {
      type: "scan",
      targetId: knight.id
    });
    const attacked = performPlayerCommand(scanned, {
      type: "attack",
      targetId: knight.id
    });

    expect(attacked.enemies[0].theftMarked).toBe(true);
  });

  it("패치 조합이 활성화되면 전투 상태에 반영된다", () => {
    const combat = makeCombat("archive-gate", {
      movement: "afterstrike-step",
      combat: "position-swap"
    });
    const knight = combat.enemies.find((enemy) => enemy.templateId === "watch-knight")!;
    combat.enemies = [knight];
    combat.player.position = { x: 4, y: 4 };
    knight.position = { x: 4, y: 3 };

    const next = performPlayerCommand(combat, {
      type: "attack",
      targetId: knight.id
    });

    expect(getActiveRecipeIds(combat.equippedRules, true)).toContain("backdoor");
    expect(next.availableBonusMoves).toBe(2);
  });

  it("보스는 체력 구간에 따라 세 위상으로 전환된다", () => {
    let combat = makeCombat("administrator-core");
    const boss = combat.enemies.find((enemy) => enemy.templateId === "dungeon-administrator")!;
    boss.hp = 7;

    combat = performPlayerCommand(combat, {
      type: "wait"
    });

    expect(combat.enemies.find((enemy) => enemy.templateId === "dungeon-administrator")?.flags.bossPhase).toBe(2);

    const bossAfter = combat.enemies.find((enemy) => enemy.templateId === "dungeon-administrator")!;
    bossAfter.hp = 3;
    combat = performPlayerCommand(combat, {
      type: "wait"
    });

    expect(combat.enemies.find((enemy) => enemy.templateId === "dungeon-administrator")?.flags.bossPhase).toBe(3);
  });

  it("로컬 저장은 메타 진행도를 손상 없이 보존한다", () => {
    const meta = {
      ...DEFAULT_META,
      discoveredRuleIds: ["afterstrike-step", "corpse-burst"],
      discoveredEnemyIds: ["watch-knight"],
      discoveredRecipeIds: ["backdoor"],
      bestVictorySeed: 321
    };

    saveMetaProgress(meta);
    const loaded = loadMetaProgress();

    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
    expect(loaded.discoveredRuleIds).toEqual(meta.discoveredRuleIds);
    expect(loaded.discoveredEnemyIds).toEqual(meta.discoveredEnemyIds);
    expect(loaded.discoveredRecipeIds).toEqual(meta.discoveredRecipeIds);
    expect(loaded.bestVictorySeed).toBe(321);
  });
});
