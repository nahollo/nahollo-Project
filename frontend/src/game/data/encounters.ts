import { EncounterDefinition } from "../engine/types";

export const ENCOUNTERS: EncounterDefinition[] = [
  {
    id: "archive-gate",
    type: "battle",
    koreanName: "보관층 입구",
    flavor: "낡은 규칙이 쌓인 첫 층. 기초적인 법칙을 이해하기 좋은 장소다.",
    mapTemplate: [
      "#########",
      "#...^...#",
      "#.......#",
      "#..#.#..#",
      "#.......#",
      "#..C....#",
      "#.......#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["watch-knight", "slime-mass"],
    enemyStarts: [
      { x: 4, y: 2 },
      { x: 6, y: 4 }
    ],
    playerStart: { x: 4, y: 7 }
  },
  {
    id: "rot-garden",
    type: "battle",
    koreanName: "부패 정원",
    flavor: "독과 잔해가 얽힌 정원. 간접 처치와 종결 규칙을 가르친다.",
    mapTemplate: [
      "#########",
      "#..^.^..#",
      "#.......#",
      "#.###...#",
      "#..C....#",
      "#.......#",
      "#..^.^..#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["bomb-beetle", "slime-mass", "audit-drone"],
    enemyStarts: [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 4, y: 4 }
    ],
    playerStart: { x: 4, y: 7 }
  },
  {
    id: "mirror-ward",
    type: "battle",
    koreanName: "거울 회랑",
    flavor: "반사와 복제가 얽힌 회랑. 도구 사용 순서를 조심해야 한다.",
    mapTemplate: [
      "#########",
      "#...#...#",
      "#.......#",
      "#..#.#..#",
      "#.......#",
      "#....C..#",
      "#.......#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["mirror-doll", "wraith", "watch-knight"],
    enemyStarts: [
      { x: 2, y: 2 },
      { x: 6, y: 3 },
      { x: 4, y: 2 }
    ],
    playerStart: { x: 4, y: 7 }
  },
  {
    id: "clock-foundry",
    type: "battle",
    koreanName: "시계 공장",
    flavor: "시간의 압박이 느껴지는 층. 추가 행동과 봉인에 대비해야 한다.",
    mapTemplate: [
      "#########",
      "#.......#",
      "#.###.#.#",
      "#..^....#",
      "#.......#",
      "#..C.^..#",
      "#.......#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["clock-soldier", "censor-eye", "bomb-beetle"],
    enemyStarts: [
      { x: 4, y: 2 },
      { x: 6, y: 4 },
      { x: 2, y: 3 }
    ],
    playerStart: { x: 4, y: 7 }
  },
  {
    id: "mirror-witch-duel",
    type: "elite",
    koreanName: "거울 마녀",
    flavor: "당신이 훔쳐온 문법을 거울처럼 되비추는 고위 관리자다.",
    mapTemplate: [
      "#########",
      "#...^...#",
      "#.......#",
      "#..#.#..#",
      "#...C...#",
      "#..#.#..#",
      "#.......#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["mirror-witch", "mirror-doll"],
    enemyStarts: [
      { x: 4, y: 2 },
      { x: 6, y: 5 }
    ],
    playerStart: { x: 4, y: 7 }
  },
  {
    id: "administrator-core",
    type: "boss",
    koreanName: "관리자 코어",
    flavor: "모든 규칙을 감사하고 되돌리려는 관리자 코어. 훔친 법칙이 시험대에 오른다.",
    mapTemplate: [
      "#########",
      "#..^.^..#",
      "#.......#",
      "#..###..#",
      "#...C...#",
      "#..###..#",
      "#.......#",
      "#...P...#",
      "#########"
    ],
    enemyIds: ["dungeon-administrator", "audit-drone", "clock-soldier"],
    enemyStarts: [
      { x: 4, y: 2 },
      { x: 2, y: 4 },
      { x: 6, y: 4 }
    ],
    playerStart: { x: 4, y: 7 }
  }
];

export const ENCOUNTER_MAP = Object.fromEntries(
  ENCOUNTERS.map((encounter) => [encounter.id, encounter])
);
