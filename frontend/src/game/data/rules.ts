import { RuleDefinition } from "../engine/types";

export const RULE_DEFINITIONS: RuleDefinition[] = [
  {
    id: "afterstrike-step",
    koreanName: "후공이동",
    englishName: "Afterstrike Step",
    category: "movement",
    rarity: "common",
    description: "공격 후 1칸 이동할 수 있다.",
    keywords: ["이동", "공격", "후속"],
    hooks: ["onAttack"]
  },
  {
    id: "phase-walk",
    koreanName: "위상보행",
    englishName: "Phase Walk",
    category: "movement",
    rarity: "rare",
    description: "전투당 1회, 첫 벽 진입을 무시한다.",
    keywords: ["이동", "위상"],
    hooks: ["onMove"]
  },
  {
    id: "echo-step",
    koreanName: "잔상보행",
    englishName: "Echo Step",
    category: "movement",
    rarity: "common",
    description: "이동 후 이전 칸에 잔상을 남기고, 그 칸을 노린 첫 공격이 빗나간다.",
    keywords: ["이동", "잔상"],
    hooks: ["onMove"]
  },
  {
    id: "line-dash",
    koreanName: "직선대시",
    englishName: "Line Dash",
    category: "movement",
    rarity: "common",
    description: "2라운드 연속 이동/대기만 했다면 다음 이동은 2칸 직선 이동이 된다.",
    keywords: ["이동", "직선"],
    hooks: ["onRoundStart", "onMove", "onRoundEnd"]
  },
  {
    id: "position-swap",
    koreanName: "위치치환",
    englishName: "Position Swap",
    category: "combat",
    rarity: "common",
    description: "공격 시 대상과 위치를 교체한다.",
    keywords: ["공격", "교환"],
    hooks: ["onAttack"]
  },
  {
    id: "hook-strike",
    koreanName: "훅타격",
    englishName: "Hook Strike",
    category: "combat",
    rarity: "common",
    description: "공격 시 대상을 1칸 끌어당긴다.",
    keywords: ["공격", "이동"],
    hooks: ["onAttack"]
  },
  {
    id: "frontal-counter",
    koreanName: "정면반격",
    englishName: "Frontal Counter",
    category: "combat",
    rarity: "common",
    description: "이번 라운드에 이동하지 않았다면 첫 정면 근접 공격에 반격한다.",
    keywords: ["반격", "교전"],
    hooks: ["onReceiveDamage"]
  },
  {
    id: "silencing-strike",
    koreanName: "절단타",
    englishName: "Silencing Strike",
    category: "combat",
    rarity: "common",
    description: "전투 중 첫 공격은 침묵을 1라운드 부여한다.",
    keywords: ["침묵", "공격"],
    hooks: ["onAttack"]
  },
  {
    id: "toxin-reversal",
    koreanName: "독반전",
    englishName: "Toxin Reversal",
    category: "state",
    rarity: "rare",
    description: "자신이 받는 독은 재생으로 바뀐다.",
    keywords: ["독", "재생"],
    hooks: ["onReceiveStatus"]
  },
  {
    id: "guarded-wait",
    koreanName: "대기보호",
    englishName: "Guarded Wait",
    category: "state",
    rarity: "common",
    description: "대기 시 보호막 1을 얻는다.",
    keywords: ["대기", "보호막"],
    hooks: ["onRoundEnd"]
  },
  {
    id: "first-curse-mirror",
    koreanName: "첫저주반사",
    englishName: "First Curse Mirror",
    category: "state",
    rarity: "rare",
    description: "전투 중 처음 받는 디버프를 반사한다.",
    keywords: ["반사", "상태"],
    hooks: ["onReceiveStatus"]
  },
  {
    id: "cleansing-hit",
    koreanName: "정화타",
    englishName: "Cleansing Hit",
    category: "state",
    rarity: "common",
    description: "공격 시 자신의 디버프 하나를 제거한다.",
    keywords: ["정화", "공격"],
    hooks: ["onAttack"]
  },
  {
    id: "corpse-wall",
    koreanName: "시체벽",
    englishName: "Corpse Wall",
    category: "termination",
    rarity: "common",
    description: "적 사망 시 그 타일을 2라운드 동안 막힌 시체 타일로 만든다.",
    keywords: ["시체", "방벽"],
    hooks: ["onDeath"]
  },
  {
    id: "corpse-burst",
    koreanName: "시체폭발",
    englishName: "Corpse Burst",
    category: "termination",
    rarity: "common",
    description: "적 사망 시 인접 칸에 1 피해를 준다.",
    keywords: ["폭발", "종결"],
    hooks: ["onDeath"]
  },
  {
    id: "execution-cache",
    koreanName: "실행 캐시",
    englishName: "Execution Cache",
    category: "termination",
    rarity: "rare",
    description: "전투 중 첫 처치 성공 시 도구 쿨다운 하나를 1 줄인다.",
    keywords: ["쿨다운", "처치"],
    hooks: ["onDeath"]
  },
  {
    id: "reclaim-shard",
    koreanName: "회수 잔해",
    englishName: "Reclaim Shard",
    category: "termination",
    rarity: "rare",
    description: "적 사망 위치에 회복 파편이 생기고 밟으면 1 회복한다.",
    keywords: ["회복", "파편"],
    hooks: ["onDeath"]
  },
  {
    id: "unstable-body",
    koreanName: "불안정 육체",
    englishName: "Unstable Body",
    category: "termination",
    rarity: "common",
    description: "직접 공격을 받으면 불안정 파편을 남긴다.",
    keywords: ["분열", "잔해"],
    hooks: ["onReceiveDamage"],
    signatureFromEnemyId: "slime-mass"
  },
  {
    id: "copied-tool",
    koreanName: "거울 복제",
    englishName: "Tool Mirror",
    category: "combat",
    rarity: "rare",
    description: "마지막으로 본 도구를 흉내 낸다.",
    keywords: ["복제", "도구"],
    hooks: ["onActionDeclare"],
    signatureFromEnemyId: "mirror-doll"
  },
  {
    id: "rule-censor",
    koreanName: "검열 오라",
    englishName: "Censor Aura",
    category: "state",
    rarity: "rare",
    description: "가까이 다가가면 규칙 슬롯 하나를 봉인한다.",
    keywords: ["봉인", "오라"],
    hooks: ["onRoundStart"],
    signatureFromEnemyId: "censor-eye"
  },
  {
    id: "clock-surge",
    koreanName: "시계중첩",
    englishName: "Clock Surge",
    category: "combat",
    rarity: "rare",
    description: "3라운드마다 추가 행동을 얻는다.",
    keywords: ["추가 행동", "시계"],
    hooks: ["onRoundStart"],
    signatureFromEnemyId: "clock-soldier"
  }
];

export const RULE_MAP = Object.fromEntries(
  RULE_DEFINITIONS.map((rule) => [rule.id, rule])
);
