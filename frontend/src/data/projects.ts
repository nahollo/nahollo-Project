export type ProjectCategory = "Fullstack" | "AI/Data";

export interface ProjectCertificate {
  label: string;
  url: string;
}

export interface ProjectItem {
  category: ProjectCategory;
  certificates?: ProjectCertificate[];
  date: string;
  demoLabel?: string;
  demoLink?: string;
  description: string;
  ghLink: string;
  imageKey: "bitsOfCode" | "chatify" | "editor" | "emotion" | "leaf" | "suicide";
  imagePosition?: string;
  imageScale?: number;
  role: string;
  techStack: string[];
  title: string;
}

export const projects: ProjectItem[] = [
  {
    imageKey: "chatify",
    title: "GMOVIE",
    date: "2024",
    category: "Fullstack",
    role: "WebRTC 기반 실시간 시청 경험과 서비스 흐름 구현",
    techStack: ["React", "WebRTC", "Spring Boot", "PostgreSQL"],
    description:
      "실시간 커뮤니케이션과 몰입감 있는 시청 흐름을 연결하기 위해, 브라우저 상호작용부터 API와 데이터 구조까지 함께 설계한 영상 기반 서비스 프로젝트입니다.",
    ghLink: "https://github.com/nahollo/GMOVIE",
    certificates: [
      { label: "ETRI", url: "/certificates/gmovie-etri-award.pdf" },
      { label: "메이커톤", url: "/certificates/gmovie-makerthon-award.pdf" }
    ],
    imageScale: 1.26,
    imagePosition: "center top"
  },
  {
    imageKey: "bitsOfCode",
    title: "소나기",
    date: "2023",
    category: "Fullstack",
    role: "기부 흐름 UX 설계와 웹·앱 사용자 경험 구현",
    techStack: ["React", "React Native", "Flask", "Selenium"],
    description:
      "예약 부도로 남는 음식을 기부로 연결하기 위해, 소상공인과 기부처를 잇는 흐름과 기부 인증, 최신 정보, 영수증 발급 경험을 설계한 웹·모바일 프로젝트입니다.",
    ghLink: "https://github.com/aSIX-final-project/sonagi_web",
    certificates: [{ label: "총장상", url: "/certificates/sonagi-president-award.pdf" }],
    imageScale: 1.2,
    imagePosition: "center top"
  },
  {
    imageKey: "suicide",
    title: "NoYakZone",
    date: "2024",
    category: "Fullstack",
    role: "문제 해결형 서비스 기획과 사용자 흐름 구현",
    techStack: ["React", "Spring Boot", "PostgreSQL", "AI"],
    description:
      "불법 마약 게시글 탐지와 중독자 상담 연결 문제를 서비스 구조로 풀기 위해, 사용자 관점의 탐색 흐름과 백엔드 연동을 함께 설계한 문제 해결형 프로젝트입니다.",
    ghLink: "https://github.com/NoYakZone/NoYakZone",
    imageScale: 1.22,
    imagePosition: "center 26%"
  },
  {
    imageKey: "editor",
    title: "다모아",
    date: "2025",
    category: "AI/Data",
    role: "라이브커머스 통합 탐색, 검색, 추천 구조 설계",
    techStack: ["React", "TypeScript", "Spring Boot", "Elasticsearch"],
    description:
      "여러 플랫폼의 라이브커머스 방송과 상품 정보를 수집, 분류, 검색, 추천까지 연결하기 위해 사용자 화면과 Spring API, 검색 인프라, 데이터 파이프라인을 함께 다룬 통합 플랫폼입니다.",
    ghLink: "https://github.com/sm-comprehensive-project/comprehensive_project_react",
    certificates: [{ label: "4차 산업혁명 페스티벌", url: "/certificates/damoa-industry-festival-award.pdf" }],
    imageScale: 1.28,
    imagePosition: "center top"
  },
  {
    imageKey: "leaf",
    title: "청순가련",
    date: "2024",
    category: "Fullstack",
    role: "청년 창업 지원 서비스 UX와 모바일 구현",
    techStack: ["React Native", "Spring Boot", "PostgreSQL", "Chatbot"],
    description:
      "도시재생 지역의 유휴 공간과 청년 창업 수요를 연결하기 위해, 임대 공간 탐색, 상권 분석, 창업 지원 챗봇 경험을 모바일 서비스로 풀어낸 프로젝트입니다.",
    ghLink: "https://github.com/Y-O-U-R-S/mobile_SW_project_2",
    certificates: [{ label: "청년리빙랩 해커톤", url: "/certificates/cheongsungaryeon-livinglab-award.pdf" }],
    imageScale: 1.22,
    imagePosition: "center 38%"
  }
];
