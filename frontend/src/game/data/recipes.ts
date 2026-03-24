import { RecipeDefinition } from "../engine/types";

export const RECIPES: RecipeDefinition[] = [
  {
    id: "backdoor",
    koreanName: "백도어",
    englishName: "Backdoor",
    requiredRuleIds: ["afterstrike-step", "position-swap"],
    description: "위치 교환이 발동한 공격 후 추가 이동이 1칸 더 늘어난다."
  },
  {
    id: "shard-barricade",
    koreanName: "파편 바리케이드",
    englishName: "Shard Barricade",
    requiredRuleIds: ["corpse-wall", "corpse-burst"],
    description:
      "시체벽이 처음 통과되거나 밀쳐질 때 1 피해를 주는 방벽으로 변한다."
  },
  {
    id: "static-cycle",
    koreanName: "정적 순환",
    englishName: "Static Cycle",
    requiredRuleIds: ["toxin-reversal", "guarded-wait"],
    description: "독 상태에서 대기하면 즉시 보호막과 재생을 동시에 얻는다."
  },
  {
    id: "ghost-counter",
    koreanName: "유령 반격",
    englishName: "Ghost Counter",
    requiredRuleIds: ["phase-walk", "frontal-counter"],
    description: "벽을 통과한 직후의 첫 정면반격은 방향 조건을 한 번 무시한다."
  }
];

export const RECIPE_DEFINITIONS = RECIPES;
