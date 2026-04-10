export interface MainNavigationItem {
  readonly to: string;
  readonly label: string;
  readonly end?: boolean;
}

export interface HomePreviewCard {
  readonly title: string;
  readonly to: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly accent: string;
  readonly glow: string;
  readonly highlights: readonly string[];
}

export interface UpdateLogItem {
  readonly title: string;
  readonly timestamp: string;
  readonly detail: string;
}

export const siteMeta = {
  name: "nahollo",
  description: "A self-hosted personal internet space to experiment, play, and leave a mark.",
  koreanTagline: "혼자 두는 포트폴리오가 아니라, 실험하고 놀고 흔적을 남기는 개인 인터넷 공간.",
  repoUrl: "https://github.com/nahollo/nahollo-Project",
  social: {
    github: "https://github.com/nahollo",
    instagram: "https://www.instagram.com/nahollo",
    linkedin: "https://www.linkedin.com/in/nahollo/",
    twitter: "https://twitter.com/nahollo"
  }
} as const;

export const mainNavigation: readonly MainNavigationItem[] = [
  { to: "/", label: "홈", end: true },
  { to: "/canvas", label: "캔버스" },
  { to: "/games", label: "게임" },
  { to: "/homelab", label: "홈랩" },
  { to: "/tools", label: "툴" }
];

export const homePreviewCards: readonly HomePreviewCard[] = [
  {
    title: "캔버스",
    to: "/canvas",
    eyebrow: "Live board",
    description: "128×128 커뮤니티 픽셀 보드에서 누구나 한 칸씩 흔적을 남깁니다.",
    accent: "#ff6b9d",
    glow: "rgba(255, 107, 157, 0.2)",
    highlights: ["32색 고정 팔레트", "IP 기준 5분 쿨다운", "웹소켓 실시간 동기화"]
  },
  {
    title: "게임",
    to: "/games",
    eyebrow: "Mini arcade",
    description: "코드 타이핑, 점프 게임, 텍스트 어드벤처를 한 곳에서 바로 플레이합니다.",
    accent: "#39d353",
    glow: "rgba(57, 211, 83, 0.2)",
    highlights: ["타이핑 점수", "무한 점프 러너", "서버룸 어드벤처"]
  },
  {
    title: "홈랩",
    to: "/homelab",
    eyebrow: "Server pulse",
    description: "집 안에서 돌아가는 서버의 상태와 방문자 흐름을 실시간으로 봅니다.",
    accent: "#00ff41",
    glow: "rgba(0, 255, 65, 0.15)",
    highlights: ["CPU · RAM · DISK", "DB 연결 상태", "배포 로그와 방문자 통계"]
  },
  {
    title: "툴",
    to: "/tools",
    eyebrow: "Pocket utilities",
    description: "브라우저 안에서 바로 쓰는 작은 개발 도구 모음입니다.",
    accent: "#ffd60a",
    glow: "rgba(255, 214, 10, 0.18)",
    highlights: ["JSON · Base64", "UUID · Timestamp", "Color · Markdown"]
  }
];

export const homeUpdateLog: readonly UpdateLogItem[] = [
  {
    title: "Pixel canvas opened",
    timestamp: "2026-04-10 09:30",
    detail: "128×128 라이브 픽셀 보드와 5분 쿨다운 규칙을 연결했습니다."
  },
  {
    title: "Typing game added",
    timestamp: "2026-04-10 09:05",
    detail: "코드 스니펫으로 WPM과 정확도를 재는 첫 번째 미니 게임을 추가했습니다."
  },
  {
    title: "Homelab dashboard wired",
    timestamp: "2026-04-10 08:45",
    detail: "서버 리소스, DB 상태, 방문자 통계를 한 화면에서 확인할 수 있게 정리했습니다."
  },
  {
    title: "Tool bench started",
    timestamp: "2026-04-10 08:10",
    detail: "JSON 포매터와 Markdown 프리뷰부터 브라우저 툴 벤치를 열었습니다."
  }
];

export const canvasPalette: readonly string[] = [
  "#101820",
  "#172b4d",
  "#204060",
  "#2d5f73",
  "#2f8f83",
  "#4eb78d",
  "#8ed9a8",
  "#d5f2d9",
  "#f4f7f5",
  "#f7e4b2",
  "#f6c667",
  "#ec8f3e",
  "#dd5d3a",
  "#c8394f",
  "#8d2441",
  "#541b2b",
  "#241e4e",
  "#433885",
  "#6557c2",
  "#8a7ef0",
  "#b2a9ff",
  "#e0dbff",
  "#f7d6ff",
  "#ffaddf",
  "#ff7db8",
  "#ff5685",
  "#ef395d",
  "#bf264c",
  "#7d2038",
  "#57442c",
  "#8d6b41",
  "#c4a56d"
];
