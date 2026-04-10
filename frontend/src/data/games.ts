export interface TypingSnippet {
  readonly id: string;
  readonly title: string;
  readonly language: string;
  readonly lines: readonly string[];
}

export interface GameCatalogItem {
  readonly slug: "typing" | "jump" | "adventure";
  readonly title: string;
  readonly description: string;
  readonly leaderboardLabel?: string;
}

export interface AdventureChoice {
  readonly label: string;
  readonly next: string;
}

export interface AdventureNode {
  readonly id: string;
  readonly title: string;
  readonly text: readonly string[];
  readonly choices: readonly AdventureChoice[];
}

export const gamesCatalog: readonly GameCatalogItem[] = [
  {
    slug: "typing",
    title: "코드 타이핑",
    description: "랜덤 코드 스니펫을 빠르고 정확하게 입력해 WPM과 정확도를 기록합니다.",
    leaderboardLabel: "Top 10 타이핑 점수"
  },
  {
    slug: "jump",
    title: "서버 점프",
    description: "버그와 서버 장애물을 피하는 무한 러너입니다. 오래 버틸수록 점수가 올라갑니다.",
    leaderboardLabel: "Top 10 점프 점수"
  },
  {
    slug: "adventure",
    title: "서버룸 어드벤처",
    description: "선택지에 따라 다른 길로 흘러가는 텍스트 기반 모험입니다."
  }
];

export const typingSnippets: readonly TypingSnippet[] = [
  {
    id: "tsx-status-card",
    title: "React status card",
    language: "tsx",
    lines: [
      "function StatusCard({ label, value }: Props) {",
      "  return (",
      "    <article className=\"status-card\">",
      "      <strong>{label}</strong>",
      "      <span>{value}</span>",
      "    </article>",
      "  );",
      "}"
    ]
  },
  {
    id: "spring-controller",
    title: "Spring endpoint",
    language: "java",
    lines: [
      "@GetMapping(\"/api/status/uptime\")",
      "public UptimeResponse uptime() {",
      "  return new UptimeResponse(systemMetricsService.readUptimeSeconds());",
      "}"
    ]
  },
  {
    id: "canvas-hook",
    title: "Canvas effect",
    language: "ts",
    lines: [
      "useEffect(() => {",
      "  const socket = new WebSocket(url);",
      "  socket.onmessage = (event) => setPixels(JSON.parse(event.data));",
      "  return () => socket.close();",
      "}, [url]);"
    ]
  },
  {
    id: "deploy-log",
    title: "Deploy log filter",
    language: "ts",
    lines: [
      "const latestDeploys = deploys",
      "  .filter((item) => item.conclusion !== \"cancelled\")",
      "  .slice(0, 5);"
    ]
  }
];

export const adventureNodes: Record<string, AdventureNode> = {
  start: {
    id: "start",
    title: "00:03, server room",
    text: [
      "은은한 팬 소리 사이로 상태 LED가 깜빡입니다.",
      "조용하지만 완전히 고요하진 않습니다. 랙 너머에서 무언가가 규칙적으로 끊기는 소리가 들립니다."
    ],
    choices: [
      { label: "소리가 나는 쪽으로 간다", next: "rack" },
      { label: "모니터링 콘솔을 연다", next: "console" }
    ]
  },
  rack: {
    id: "rack",
    title: "rack-07",
    text: [
      "맨 아래 선반의 미니 PC가 짧은 부팅음을 반복합니다.",
      "전면 스티커에는 'nahollo / do not unplug' 라고 적혀 있습니다."
    ],
    choices: [
      { label: "전원을 완전히 내렸다가 다시 켠다", next: "reboot" },
      { label: "LAN 케이블을 따라간다", next: "switch" }
    ]
  },
  console: {
    id: "console",
    title: "monitoring console",
    text: [
      "대시보드는 대부분 초록색입니다. 하지만 canvas-ws 연결 수가 갑자기 치솟고 있습니다.",
      "이 방문자들이 픽셀 하나씩 남기고 있다는 뜻처럼 보입니다."
    ],
    choices: [
      { label: "웹소켓 로그를 본다", next: "websocket" },
      { label: "방문자 통계를 본다", next: "visitors" }
    ]
  },
  reboot: {
    id: "reboot",
    title: "cold restart",
    text: [
      "짧은 정적이 흐른 뒤 서버가 멈추고 방 안이 더 조용해집니다.",
      "몇 초 뒤 미니 PC가 다시 살아나고 화면에는 한 줄이 찍힙니다: 'playground online'."
    ],
    choices: [{ label: "다시 처음으로", next: "start" }]
  },
  switch: {
    id: "switch",
    title: "patch panel",
    text: [
      "케이블 옆의 작은 스위치에 붉은 라벨로 'jump-game' 이라고 적혀 있습니다.",
      "반대편 랙에서 알림음이 울립니다."
    ],
    choices: [{ label: "알림음을 따라간다", next: "websocket" }]
  },
  websocket: {
    id: "websocket",
    title: "live feed",
    text: [
      "로그는 단순하지만 묘하게 생기 있습니다. x, y, colorIndex, nickname, timestamp.",
      "각자의 아주 작은 선택들이 모여 오늘의 배경을 만들고 있습니다."
    ],
    choices: [{ label: "다시 처음으로", next: "start" }]
  },
  visitors: {
    id: "visitors",
    title: "visitor counter",
    text: [
      "오늘 방문자 수가 어제보다 조금 더 많습니다.",
      "혼자 만든 공간이지만, 이제 완전히 혼자 있는 곳은 아니라는 생각이 듭니다."
    ],
    choices: [{ label: "다시 처음으로", next: "start" }]
  }
};
