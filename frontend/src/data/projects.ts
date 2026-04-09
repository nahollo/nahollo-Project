export type ProjectCategory = "Fullstack" | "AI/Data";

export interface ProjectCertificate {
  label: string;
  previewUrl: string;
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
  imageKey: "bitsOfCode" | "chatify" | "editor" | "leaf" | "suicide";
  imagePosition?: string;
  imageScale?: number;
  role: string;
  techStack: string[];
  title: string;
}

export const projects: ProjectItem[] = [
  {
    imageKey: "editor",
    title: "다모아",
    date: "2025.03-06",
    category: "AI/Data",
    role: "라이브커머스 수집·정제·추천 흐름",
    techStack: ["React", "Spring Boot", "MongoDB", "Playwright", "KoSimCSE"],
    description: "라이브 방송 통합 수집과 카테고리 정제, 추천 흐름을 연결한 AI/Data 프로젝트입니다.",
    ghLink: "https://github.com/sm-comprehensive-project",
    certificates: [
      {
        label: "논문경진 은상",
        previewUrl: "/certificates/previews/damoa-paper-silver-award.png",
        url: "/certificates/damoa-paper-silver-award.pdf"
      },
      {
        label: "기업연계 동상",
        previewUrl: "/certificates/previews/damoa-industry-bronze-award.png",
        url: "/certificates/damoa-industry-bronze-award.pdf"
      }
    ],
    imageScale: 1.28,
    imagePosition: "center top"
  },
  {
    imageKey: "chatify",
    title: "GMOVIE",
    date: "2023.10-11",
    category: "Fullstack",
    role: "WebRTC·STT·요약 흐름",
    techStack: ["JavaScript", "Spring Boot", "Node.js", "WebRTC", "ETRI OpenAPI"],
    description: "화상회의에 녹음, STT 회의록, 자동 요약, 이메일 발송을 연결한 협업 플랫폼입니다.",
    ghLink: "https://github.com/nahollo/GMOVIE",
    demoLabel: "시연 영상",
    demoLink: "https://youtu.be/96V_vCy1H0w",
    certificates: [
      {
        label: "ETRI 장려상",
        previewUrl: "/certificates/previews/gmovie-etri-award.png",
        url: "/certificates/gmovie-etri-award.pdf"
      },
      {
        label: "메이커톤 우수상",
        previewUrl: "/certificates/previews/gmovie-makerthon-award.png",
        url: "/certificates/gmovie-makerthon-award.pdf"
      }
    ],
    imageScale: 1.26,
    imagePosition: "center top"
  },
  {
    imageKey: "suicide",
    title: "NoYakZone",
    date: "2024.05-06",
    category: "Fullstack",
    role: "서버·배포·데이터 구조 총괄",
    techStack: ["React", "Spring Boot", "PostgreSQL", "AWS EC2/S3", "Flask"],
    description: "의심 게시글 탐지, 익명 상담, 기관용 데이터 관리를 하나로 묶은 공공 문제 해결형 플랫폼입니다.",
    ghLink: "https://github.com/NoYakZone/NoYakZone",
    demoLabel: "시연 영상",
    demoLink: "https://youtu.be/8Sn6vZ6Viv0",
    imageScale: 1.22,
    imagePosition: "center 26%"
  },
  {
    imageKey: "bitsOfCode",
    title: "소나기",
    date: "2023.11-12",
    category: "Fullstack",
    role: "등록부터 위치 기반 매칭까지",
    techStack: ["React", "React Native", "Spring Boot", "Node.js", "Kakao API"],
    description: "등록, 수령자 매칭, 위치 기반 알림까지 이어지는 음식 기부 웹·앱 프로젝트입니다.",
    ghLink: "https://github.com/aSIX-final-project/Sonagi_App",
    demoLabel: "시연 영상",
    demoLink: "https://youtu.be/k6Vu36V32qI",
    certificates: [
      {
        label: "산출물 경진 대상",
        previewUrl: "/certificates/previews/sonagi-president-award.png",
        url: "/certificates/sonagi-president-award.pdf"
      }
    ],
    imageScale: 1.2,
    imagePosition: "center top"
  },
  {
    imageKey: "leaf",
    title: "청순가련",
    date: "2024.09-11",
    category: "Fullstack",
    role: "입점 흐름과 문서 기반 Q&A",
    techStack: ["React Native", "Spring Boot", "PostgreSQL", "LangGraph", "Cohere API"],
    description: "입점 신청, 문서 검색, Q&A 안내를 하나의 흐름으로 연결한 청년 팝업스토어 지원 서비스입니다.",
    ghLink: "https://github.com/Y-O-U-R-S/mobile_SW_project_2",
    demoLabel: "시연 영상",
    demoLink: "https://www.youtube.com/watch?v=Y4zs_cDWqVc",
    certificates: [
      {
        label: "청년리빙랩 우수상",
        previewUrl: "/certificates/previews/cheongsungaryeon-livinglab-award.png",
        url: "/certificates/cheongsungaryeon-livinglab-award.pdf"
      }
    ],
    imageScale: 1.22,
    imagePosition: "center 38%"
  }
];
