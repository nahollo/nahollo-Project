import { EnemyDefinition } from "../engine/types";

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  {
    id: "watch-knight",
    koreanName: "감시기사",
    englishName: "Watch Knight",
    maxHp: 3,
    damage: 1,
    color: "#46f0ff",
    signatureRuleId: "frontal-counter",
    theftConditionId: "watch-counter",
    behavior: "watchKnight",
    role: "정면 대치 유도"
  },
  {
    id: "slime-mass",
    koreanName: "슬라임 덩이",
    englishName: "Slime Mass",
    maxHp: 3,
    damage: 1,
    color: "#b8ff5d",
    signatureRuleId: "unstable-body",
    theftConditionId: "indirect-kill",
    behavior: "slimeMass",
    role: "직접 타격 억제"
  },
  {
    id: "wraith",
    koreanName: "망령",
    englishName: "Wraith",
    maxHp: 2,
    damage: 1,
    color: "#c08bff",
    signatureRuleId: "phase-walk",
    theftConditionId: "phase-adjacent-wall",
    behavior: "wraith",
    role: "지형 무시"
  },
  {
    id: "bomb-beetle",
    koreanName: "폭뢰벌레",
    englishName: "Bomb Beetle",
    maxHp: 2,
    damage: 1,
    color: "#ff6f7d",
    signatureRuleId: "corpse-burst",
    theftConditionId: "shove-collision",
    behavior: "bombBeetle",
    role: "종결 압박"
  },
  {
    id: "mirror-doll",
    koreanName: "거울 인형",
    englishName: "Mirror Doll",
    maxHp: 2,
    damage: 1,
    color: "#ff62d3",
    signatureRuleId: "copied-tool",
    theftConditionId: "copied-then-kill",
    behavior: "mirrorDoll",
    role: "도구 남용 제어"
  },
  {
    id: "censor-eye",
    koreanName: "검열안",
    englishName: "Censor Eye",
    maxHp: 3,
    damage: 1,
    color: "#f2d57c",
    signatureRuleId: "rule-censor",
    theftConditionId: "sealed-slot-kill",
    behavior: "censorEye",
    role: "규칙 봉인"
  },
  {
    id: "clock-soldier",
    koreanName: "시계병",
    englishName: "Clock Soldier",
    maxHp: 4,
    damage: 1,
    color: "#7ed6ff",
    signatureRuleId: "clock-surge",
    theftConditionId: "extra-action-round",
    behavior: "clockSoldier",
    role: "시간 압박"
  },
  {
    id: "audit-drone",
    koreanName: "감사 드론",
    englishName: "Audit Drone",
    maxHp: 2,
    damage: 1,
    color: "#ff9f4a",
    signatureRuleId: "rule-censor",
    theftConditionId: "sealed-slot-kill",
    behavior: "auditDrone",
    role: "감사 열 상승 대응"
  },
  {
    id: "mirror-witch",
    koreanName: "거울 마녀",
    englishName: "Mirror Witch",
    maxHp: 8,
    damage: 1,
    color: "#ff62d3",
    signatureRuleId: "copied-tool",
    theftConditionId: "elite-victory",
    behavior: "mirrorWitch",
    role: "규칙 복사",
    elite: true
  },
  {
    id: "dungeon-administrator",
    koreanName: "던전 관리자",
    englishName: "Dungeon Administrator",
    maxHp: 12,
    damage: 1,
    color: "#46f0ff",
    signatureRuleId: "clock-surge",
    theftConditionId: "boss-victory",
    behavior: "dungeonAdministrator",
    role: "규칙 역이용",
    boss: true
  }
];

export const ENEMY_MAP = Object.fromEntries(
  ENEMY_DEFINITIONS.map((enemy) => [enemy.id, enemy])
);
