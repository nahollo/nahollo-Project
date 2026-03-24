import { useEffect, useMemo } from "react";
import CombatBoard from "../scenes/CombatBoard";
import { useAppStore } from "./store";
import { ENEMY_MAP } from "../game/data/enemies";
import { RECIPE_DEFINITIONS } from "../game/data/recipes";
import { RULE_DEFINITIONS } from "../game/data/rules";
import {
  getActiveRecipeIds,
  getAttackTargets,
  getEnemyInfo,
  getMoveTargets,
  getRuleCategoryLabel,
  getRuleDefinition,
  getRuleTooltip
} from "../game/engine/combatEngine";
import { ActionMode, CombatState, RuleLoadout } from "../game/engine/types";

const SLOT_LABELS: Record<keyof RuleLoadout, string> = {
  movement: "이동 슬롯",
  combat: "교전 슬롯",
  state: "상태 슬롯",
  termination: "종결 슬롯"
};

function RuleChip({ ruleId }: { ruleId: string | null }) {
  const rule = ruleId ? getRuleDefinition(ruleId) : null;

  return (
    <div className={`rule-chip ${rule ? `rule-chip--${rule.category}` : "rule-chip--empty"}`} title={getRuleTooltip(ruleId)}>
      <span className="rule-chip__name">{rule?.koreanName ?? "비어 있음"}</span>
      <span className="rule-chip__category">{rule ? getRuleCategoryLabel(rule.category) : "빈 슬롯"}</span>
    </div>
  );
}

function SlotPanel({
  loadout,
  backpackRules,
  unlockedStateSlot,
  onEquip,
  onUnequip
}: {
  loadout: RuleLoadout;
  backpackRules: string[];
  unlockedStateSlot: boolean;
  onEquip?: (ruleId: string) => void;
  onUnequip?: (slot: keyof RuleLoadout) => void;
}) {
  return (
    <div className="panel panel--rules">
      <h3 className="panel__title">규칙 슬롯</h3>
      <div className="slot-grid">
        {(Object.keys(SLOT_LABELS) as Array<keyof RuleLoadout>).map((slot) => {
          const locked = slot === "state" && !unlockedStateSlot;
          const ruleId = loadout[slot];

          return (
            <div className="slot-card" key={slot}>
              <div className="slot-card__header">
                <span>{SLOT_LABELS[slot]}</span>
                {onUnequip && ruleId && !locked ? (
                  <button className="mini-button" onClick={() => onUnequip(slot)}>
                    해제
                  </button>
                ) : null}
              </div>
              {locked ? <div className="slot-card__locked">엘리트 격파 후 해금</div> : <RuleChip ruleId={ruleId} />}
            </div>
          );
        })}
      </div>

      <h3 className="panel__title panel__title--spaced">백팩</h3>
      <div className="backpack-list">
        {backpackRules.length === 0 ? <div className="empty-text">보관 중인 규칙이 없습니다.</div> : null}
        {backpackRules.map((ruleId) => {
          const rule = getRuleDefinition(ruleId);

          return (
            <button
              className={`backpack-item backpack-item--${rule?.category ?? "combat"}`}
              key={ruleId}
              onClick={() => onEquip?.(ruleId)}
              disabled={Boolean(rule?.category === "state" && !unlockedStateSlot)}
              title={getRuleTooltip(ruleId)}
            >
              <span>{rule?.koreanName ?? ruleId}</span>
              <span>{rule ? getRuleCategoryLabel(rule.category) : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActiveRecipes({ loadout, unlockedStateSlot }: { loadout: RuleLoadout; unlockedStateSlot: boolean }) {
  const activeRecipeIds = getActiveRecipeIds(loadout, unlockedStateSlot);

  return (
    <div className="panel">
      <h3 className="panel__title">발견한 패치</h3>
      <div className="recipe-list">
        {RECIPE_DEFINITIONS.map((recipe) => {
          const active = activeRecipeIds.includes(recipe.id);

          return (
            <div className={`recipe-card ${active ? "recipe-card--active" : ""}`} key={recipe.id}>
              <div className="recipe-card__name">{recipe.koreanName}</div>
              <div className="recipe-card__desc">{recipe.description}</div>
              <div className="recipe-card__tags">
                {recipe.requiredRuleIds.map((ruleId) => (
                  <span className="recipe-card__tag" key={ruleId}>
                    {getRuleDefinition(ruleId)?.koreanName ?? ruleId}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuScreen() {
  const meta = useAppStore((state) => state.meta);
  const startRun = useAppStore((state) => state.startRun);
  const continueRun = useAppStore((state) => state.continueRun);
  const openCodex = useAppStore((state) => state.openCodex);
  const openSettings = useAppStore((state) => state.openSettings);
  const openCredits = useAppStore((state) => state.openCredits);

  return (
    <div className="screen screen--menu">
      <div className="menu-hero">
        <p className="eyebrow">CANON 침투 단말</p>
        <h1 className="title-glitch">규칙도둑</h1>
        <p className="menu-copy">당신은 전사가 아니라 예외다. 적을 쓰러뜨리는 것이 아니라, 그들을 움직이게 하는 법칙을 훔친다.</p>
        <div className="menu-buttons">
          <button className="primary-button" onClick={startRun}>
            런 시작
          </button>
          <button className="secondary-button" disabled={!meta.lastRun} onClick={continueRun}>
            이어하기
          </button>
          <button className="secondary-button" onClick={openCodex}>
            코덱스
          </button>
          <button className="secondary-button" onClick={openSettings}>
            설정
          </button>
          <button className="secondary-button" onClick={openCredits}>
            크레딧
          </button>
        </div>
      </div>
      <div className="menu-terminal">
        <div>발견한 규칙: {meta.discoveredRuleIds.length}</div>
        <div>발견한 적: {meta.discoveredEnemyIds.length}</div>
        <div>발견한 패치: {meta.discoveredRecipeIds.length}</div>
        <div>최고 기록 시드: {meta.bestVictorySeed ?? "없음"}</div>
      </div>
    </div>
  );
}

function NodeMapScreen() {
  const run = useAppStore((state) => state.run);
  const goMenu = useAppStore((state) => state.goMenu);
  const enterNode = useAppStore((state) => state.enterNode);

  if (!run) {
    return null;
  }

  const columns = Array.from({ length: 8 }, (_, index) =>
    run.nodeMap.filter((node) => node.column === index + 1)
  );

  return (
    <div className="screen screen--map">
      <div className="screen-header">
        <div>
          <p className="eyebrow">노드 지도</p>
          <h2 className="screen-title">CANON 침투 경로</h2>
        </div>
        <button className="secondary-button" onClick={goMenu}>
          메뉴로
        </button>
      </div>

      <div className="map-summary">
        <div>체력 {run.playerHp}/{run.maxHp}</div>
        <div>감사 열 {run.auditHeat}</div>
        <div>시드 {run.seed}</div>
      </div>

      <div className="map-columns">
        {columns.map((column, columnIndex) => (
          <div className="map-column" key={`column-${columnIndex + 1}`}>
            {column.map((node) => (
              <button
                className={`map-node map-node--${node.type} ${node.cleared ? "is-cleared" : ""} ${node.available ? "is-available" : ""}`}
                disabled={!node.available}
                key={node.id}
                onClick={() => enterNode(node.id)}
              >
                <span className="map-node__type">{node.type.toUpperCase()}</span>
                <span className="map-node__title">{node.title}</span>
                <span className="map-node__desc">{node.description}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CombatScreen({ combat }: { combat: CombatState }) {
  const selectedAction = useAppStore((state) => state.selectedAction);
  const hoveredEnemyId = useAppStore((state) => state.hoveredEnemyId);
  const selectAction = useAppStore((state) => state.selectAction);
  const hoverEnemy = useAppStore((state) => state.hoverEnemy);
  const actOnTile = useAppStore((state) => state.actOnTile);
  const actOnUnit = useAppStore((state) => state.actOnUnit);
  const useWait = useAppStore((state) => state.useWait);

  const hoveredEnemy = getEnemyInfo(combat, hoveredEnemyId) ?? combat.enemies.find((enemy) => enemy.scanned) ?? combat.enemies[0] ?? null;
  const moveTargets = useMemo(() => (selectedAction === "move" ? getMoveTargets(combat) : []), [combat, selectedAction]);
  const attackTargets = useMemo(() => getAttackTargets(combat).map((enemy) => enemy.id), [combat]);
  const highlightedEnemyIds = useMemo(() => {
    if (selectedAction === "attack") {
      return attackTargets;
    }

    if (selectedAction === "shove") {
      return combat.enemies.filter((enemy) => enemy.alive && Math.abs(enemy.position.x - combat.player.position.x) + Math.abs(enemy.position.y - combat.player.position.y) === 1).map((enemy) => enemy.id);
    }

    if (selectedAction === "sever") {
      return combat.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id);
    }

    if (selectedAction === "scan") {
      return combat.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.id);
    }

    return hoveredEnemyId ? [hoveredEnemyId] : [];
  }, [attackTargets, combat.enemies, combat.player.position.x, combat.player.position.y, hoveredEnemyId, selectedAction]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") {
        selectAction("attack");
      } else if (event.key === "2") {
        selectAction("scan");
      } else if (event.key === "3") {
        selectAction("sever");
      } else if (event.key === "4") {
        selectAction("shove");
      } else if (event.key === "Escape") {
        selectAction("move");
      } else if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        useWait();
      } else if (selectedAction === "move") {
        const vector =
          event.key === "ArrowUp" || event.key === "w"
            ? { x: 0, y: -1 }
            : event.key === "ArrowDown" || event.key === "s"
              ? { x: 0, y: 1 }
              : event.key === "ArrowLeft" || event.key === "a"
                ? { x: -1, y: 0 }
                : event.key === "ArrowRight" || event.key === "d"
                  ? { x: 1, y: 0 }
                  : null;

        if (vector) {
          const target = {
            x: combat.player.position.x + vector.x,
            y: combat.player.position.y + vector.y
          };

          const valid = moveTargets.find((entry) => entry.x === target.x && entry.y === target.y);

          if (valid) {
            actOnTile(valid);
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actOnTile, combat.player.position.x, combat.player.position.y, moveTargets, selectAction, selectedAction, useWait]);

  const tools = [
    { mode: "move" as ActionMode, label: "이동", note: "화살표 / WASD" },
    { mode: "attack" as ActionMode, label: "공격", note: "1" },
    { mode: "scan" as ActionMode, label: "스캔", note: "2" },
    { mode: "sever" as ActionMode, label: "절단", note: "3" },
    { mode: "shove" as ActionMode, label: "밀치기", note: "4" }
  ];

  return (
    <div className="screen screen--combat">
      <div className="combat-layout">
        <aside className="combat-sidebar">
          <div className="panel">
            <h3 className="panel__title">프로세스 상태</h3>
            <div className="stat-line">체력 {combat.player.hp}/{combat.player.maxHp}</div>
            <div className="stat-line">라운드 {combat.round}</div>
            <div className="stat-line">감사 열 {combat.auditHeat}</div>
            <div className={`audit-indicator ${combat.auditWarning ? "is-hot" : ""}`}>{combat.auditWarning ? "AUDIT RISING" : "AUDIT LOW"}</div>
          </div>

          <div className="panel">
            <h3 className="panel__title">도구</h3>
            {Object.values(combat.tools)
              .filter((tool) => tool.id !== "overwrite")
              .map((tool) => (
                <div className="tool-row" key={tool.id}>
                  <span>{tool.koreanName}</span>
                  <span>{tool.cooldown > 0 ? `재사용 ${tool.cooldown}` : "준비"}</span>
                </div>
              ))}
          </div>

          <SlotPanel loadout={combat.equippedRules} backpackRules={combat.backpackRules} unlockedStateSlot={combat.stateSlotUnlocked} />
        </aside>

        <main className="combat-main">
          <div className="combat-log">
            {combat.log.map((entry) => (
              <div className={`combat-log__entry combat-log__entry--${entry.accent ?? "cyan"}`} key={entry.id}>
                <span className="combat-log__round">R{entry.round}</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>

          <div className="board-shell">
            <CombatBoard
              combat={combat}
              mode={selectedAction}
              moveTargets={moveTargets}
              highlightedEnemyIds={highlightedEnemyIds}
              onTileClick={actOnTile}
              onUnitClick={actOnUnit}
            />
          </div>

          <div className="action-bar">
            {tools.map((tool) => (
              <button
                className={`action-button ${selectedAction === tool.mode ? "is-selected" : ""}`}
                key={tool.mode}
                onClick={() => selectAction(tool.mode)}
              >
                <span>{tool.label}</span>
                <span>{tool.note}</span>
              </button>
            ))}
            <button className="action-button action-button--wait" onClick={useWait}>
              <span>대기</span>
              <span>Space</span>
            </button>
          </div>
        </main>

        <aside className="combat-sidebar combat-sidebar--right">
          <div className="panel">
            <h3 className="panel__title">적 정보</h3>
            {hoveredEnemy ? (
              <div className="enemy-card" onMouseLeave={() => hoverEnemy(null)}>
                <div className="enemy-card__name">{hoveredEnemy.koreanName}</div>
                <div className="enemy-card__line">체력 {hoveredEnemy.hp}/{hoveredEnemy.maxHp}</div>
                <div className="enemy-card__line">역할 {ENEMY_MAP[hoveredEnemy.templateId]?.role}</div>
                <div className="enemy-card__line">시그니처 {hoveredEnemy.scanned ? getRuleDefinition(hoveredEnemy.signatureRuleId ?? "")?.koreanName ?? "미확인" : "미확인"}</div>
                <div className="enemy-card__line">탈취 조건 {hoveredEnemy.scanned ? hoveredEnemy.theftConditionId : "스캔 필요"}</div>
                <div className={`mark-indicator ${hoveredEnemy.theftMarked ? "is-marked" : ""}`}>{hoveredEnemy.theftMarked ? "탈취 마크 활성" : "마크 없음"}</div>
              </div>
            ) : (
              <div className="empty-text">적을 클릭하거나 스캔해 정보를 확인하세요.</div>
            )}
          </div>

          <ActiveRecipes loadout={combat.equippedRules} unlockedStateSlot={combat.stateSlotUnlocked} />
        </aside>
      </div>
    </div>
  );
}

function RewardScreen() {
  const run = useAppStore((state) => state.run);
  const chooseReward = useAppStore((state) => state.chooseReward);

  if (!run?.currentCombat) {
    return null;
  }

  return (
    <div className="screen screen--reward">
      <div className="screen-header">
        <div>
          <p className="eyebrow">전투 보상</p>
          <h2 className="screen-title">탈취 가능한 규칙</h2>
        </div>
      </div>

      <div className="reward-grid">
        {run.currentCombat.rewardChoices.map((reward) => {
          const rule = getRuleDefinition(reward.ruleId);

          return (
            <button className={`reward-card reward-card--${rule?.category ?? "combat"}`} key={reward.id} onClick={() => chooseReward(reward.ruleId)}>
              <div className="reward-card__source">{reward.sourceLabel}</div>
              <div className="reward-card__title">{rule?.koreanName ?? reward.ruleId}</div>
              <div className="reward-card__desc">{rule?.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoomScreen({ type }: { type: "rest" | "lab" }) {
  const run = useAppStore((state) => state.run);
  const roomNotice = useAppStore((state) => state.roomNotice);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const equipFromBackpack = useAppStore((state) => state.equipFromBackpack);
  const unequipFromSlot = useAppStore((state) => state.unequipFromSlot);

  if (!run) {
    return null;
  }

  return (
    <div className="screen screen--room">
      <div className="screen-header">
        <div>
          <p className="eyebrow">{type === "rest" ? "휴식실" : "실험실"}</p>
          <h2 className="screen-title">{type === "rest" ? "프로세스 안정화" : "규칙 재배치"}</h2>
        </div>
        <button className="primary-button" onClick={leaveRoom}>
          경로로 복귀
        </button>
      </div>
      <div className="room-copy">{roomNotice}</div>
      <div className="room-layout">
        <SlotPanel loadout={run.equippedRules} backpackRules={run.backpackRules} unlockedStateSlot={run.unlockedStateSlot} onEquip={equipFromBackpack} onUnequip={unequipFromSlot} />
        <ActiveRecipes loadout={run.equippedRules} unlockedStateSlot={run.unlockedStateSlot} />
      </div>
    </div>
  );
}

function CodexScreen() {
  const meta = useAppStore((state) => state.meta);
  const goMenu = useAppStore((state) => state.goMenu);

  return (
    <div className="screen screen--codex">
      <div className="screen-header">
        <div>
          <p className="eyebrow">ARCHIVE</p>
          <h2 className="screen-title">규칙 기록 보관소</h2>
        </div>
        <button className="secondary-button" onClick={goMenu}>
          메뉴로
        </button>
      </div>

      <div className="codex-grid">
        <div className="panel">
          <h3 className="panel__title">규칙</h3>
          {RULE_DEFINITIONS.map((rule) => (
            <div className={`codex-entry ${meta.discoveredRuleIds.includes(rule.id) ? "" : "is-unknown"}`} key={rule.id}>
              <div className="codex-entry__title">{meta.discoveredRuleIds.includes(rule.id) ? rule.koreanName : "미발견 규칙"}</div>
              <div className="codex-entry__body">{meta.discoveredRuleIds.includes(rule.id) ? rule.description : "스캔 또는 보상 선택으로 해금된다."}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 className="panel__title">적</h3>
          {Object.values(ENEMY_MAP).map((enemy) => (
            <div className={`codex-entry ${meta.discoveredEnemyIds.includes(enemy.id) ? "" : "is-unknown"}`} key={enemy.id}>
              <div className="codex-entry__title">{meta.discoveredEnemyIds.includes(enemy.id) ? enemy.koreanName : "미발견 감시체"}</div>
              <div className="codex-entry__body">{meta.discoveredEnemyIds.includes(enemy.id) ? enemy.role : "스캔으로 기록이 열린다."}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 className="panel__title">패치</h3>
          {RECIPE_DEFINITIONS.map((recipe) => (
            <div className={`codex-entry ${meta.discoveredRecipeIds.includes(recipe.id) ? "" : "is-unknown"}`} key={recipe.id}>
              <div className="codex-entry__title">{meta.discoveredRecipeIds.includes(recipe.id) ? recipe.koreanName : "미발견 패치"}</div>
              <div className="codex-entry__body">{meta.discoveredRecipeIds.includes(recipe.id) ? recipe.description : "적절한 규칙 조합을 장착하면 기록이 열린다."}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsScreen() {
  const meta = useAppStore((state) => state.meta);
  const toggleSetting = useAppStore((state) => state.toggleSetting);
  const goMenu = useAppStore((state) => state.goMenu);

  const keys = [
    { id: "sfxEnabled", label: "효과음" },
    { id: "bgmEnabled", label: "배경음 플레이스홀더" },
    { id: "screenShake", label: "화면 흔들림" },
    { id: "highContrast", label: "고대비 모드" }
  ] as const;

  return (
    <div className="screen screen--settings">
      <div className="screen-header">
        <div>
          <p className="eyebrow">설정</p>
          <h2 className="screen-title">터미널 환경 조정</h2>
        </div>
        <button className="secondary-button" onClick={goMenu}>
          메뉴로
        </button>
      </div>

      <div className="settings-list">
        {keys.map((entry) => (
          <button className="settings-row" key={entry.id} onClick={() => toggleSetting(entry.id)}>
            <span>{entry.label}</span>
            <span>{meta.settings[entry.id] ? "켜짐" : "꺼짐"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CreditsScreen() {
  const goMenu = useAppStore((state) => state.goMenu);

  return (
    <div className="screen screen--credits">
      <div className="screen-header">
        <div>
          <p className="eyebrow">크레딧</p>
          <h2 className="screen-title">시스템 로그</h2>
        </div>
        <button className="secondary-button" onClick={goMenu}>
          메뉴로
        </button>
      </div>
      <div className="credits-copy">
        <p>기획과 세계관: nahollo</p>
        <p>프런트엔드/전투 시스템 구현: Codex 협업 빌드</p>
        <p>렌더링: React + Phaser 3</p>
        <p>저장: LocalStorage / 테스트: Vitest</p>
      </div>
    </div>
  );
}

function SummaryScreen() {
  const summary = useAppStore((state) => state.summary);
  const goMenu = useAppStore((state) => state.goMenu);
  const startRun = useAppStore((state) => state.startRun);

  return (
    <div className="screen screen--summary">
      <div className="summary-card">
        <p className="eyebrow">결과</p>
        <h2 className="screen-title">{summary.title}</h2>
        <p className="summary-copy">{summary.text}</p>
        <div className="menu-buttons">
          <button className="primary-button" onClick={startRun}>
            새 런 시작
          </button>
          <button className="secondary-button" onClick={goMenu}>
            메뉴로
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const boot = useAppStore((state) => state.boot);
  const screen = useAppStore((state) => state.screen);
  const run = useAppStore((state) => state.run);

  useEffect(() => {
    boot();
  }, [boot]);

  return (
    <div className="app-shell app-shell--game">
      <div className="scanline-layer" />
      <div className="noise-layer" />

      {screen === "menu" ? <MenuScreen /> : null}
      {screen === "nodeMap" ? <NodeMapScreen /> : null}
      {screen === "combat" && run?.currentCombat ? <CombatScreen combat={run.currentCombat} /> : null}
      {screen === "reward" ? <RewardScreen /> : null}
      {screen === "rest" ? <RoomScreen type="rest" /> : null}
      {screen === "lab" ? <RoomScreen type="lab" /> : null}
      {screen === "codex" ? <CodexScreen /> : null}
      {screen === "settings" ? <SettingsScreen /> : null}
      {screen === "credits" ? <CreditsScreen /> : null}
      {screen === "summary" ? <SummaryScreen /> : null}
    </div>
  );
}
