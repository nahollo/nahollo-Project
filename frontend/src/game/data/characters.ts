import { CharacterDefinition } from "../engine/types";

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: "patcher",
    koreanName: "패처",
    description:
      "규칙 보상 리롤에 능한 표준 캐릭터. 가장 안정적으로 규칙도둑의 전투 문법을 배울 수 있다.",
    maxHp: 6,
    startingRules: {
      movement: "afterstrike-step",
      combat: "silencing-strike",
      termination: "reclaim-shard"
    },
    startingTools: ["scan", "sever", "shove", "wait"],
    passiveText: "각 층마다 한 번, 규칙 보상 후보를 다시 섞을 수 있다."
  }
];
