export interface ResumeHighlight {
  description: string;
  label: string;
  title: string;
}

export interface ResumeFocusGroup {
  items: string[];
  label: string;
  title: string;
}

export interface ResumePrinciple {
  description: string;
  title: string;
}

export const resumeHighlights: ResumeHighlight[] = [
  {
    label: "Frontend Focus",
    title: "React · TypeScript",
    description: "정제된 UI와 읽기 쉬운 상태 흐름을 제품 기준으로 설계하는 역량을 중심에 두고 있습니다."
  },
  {
    label: "Service Flow",
    title: "API · Database · Deploy",
    description: "브라우저에서 서버와 데이터까지 이어지는 서비스 구조를 한 제품 안에서 함께 이해합니다."
  },
  {
    label: "Hands-on Learning",
    title: "Spring Boot · Home Server",
    description: "홈서버 실습과 백엔드 연결 학습으로 운영 감각과 구현 범위를 꾸준히 넓히고 있습니다."
  }
];

export const resumeSummary: string[] = [
  "프론트엔드에서 시작했지만, 지금은 화면 완성도와 서비스 흐름을 함께 보는 개발자로 성장하고 있습니다.",
  "React와 TypeScript로 제품처럼 정리된 UI를 만들고, Spring Boot와 PostgreSQL로 이어지는 API · 데이터 구조를 실제 서비스 흐름으로 연결하는 데 집중하고 있습니다."
];

export const resumeSignatureTags: string[] = ["UI Polish", "Service Structure", "Home Server Practice"];

export const resumePrinciples: ResumePrinciple[] = [
  {
    title: "Structure First",
    description: "기능을 붙이기 전에 화면, 상태, API, 데이터 연결 지점을 먼저 정리합니다."
  },
  {
    title: "Polish with Purpose",
    description: "spacing, typography, contrast 같은 작은 차이로 완성도를 끌어올립니다."
  },
  {
    title: "Build and Verify",
    description: "학습한 내용은 홈서버와 실습 프로젝트로 직접 구현하고 다시 점검합니다."
  }
];

export const resumeFocusGroups: ResumeFocusGroup[] = [
  {
    label: "Core Stack",
    title: "화면 완성도를 만드는 중심 기술",
    items: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Material UI"]
  },
  {
    label: "Backend / Data",
    title: "서비스 흐름을 잇는 확장 영역",
    items: ["Spring Boot", "PostgreSQL", "Firebase", "Node.js", "MongoDB", "Redis"]
  },
  {
    label: "Infra / Workflow",
    title: "운영과 검증을 위한 작업 환경",
    items: ["Ubuntu Server", "Docker", "AWS", "Git", "Postman", "VS Code", "IntelliJ"]
  }
];

export const resumeCurrentFocus: string[] = [
  "Spring Boot 기반 API 설계와 PostgreSQL 연결 감각 확장",
  "홈서버에서 웹 · API · DB 구조를 운영하며 서비스 흐름 학습",
  "제품형 UI 품질과 컴포넌트 완성도를 더 높은 기준으로 다듬기"
];
