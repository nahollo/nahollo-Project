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
    label: "Product UI",
    title: "React · TypeScript",
    description: "정제된 UI와 읽기 흐름을 제품 기준으로 설계합니다."
  },
  {
    label: "Service Flow",
    title: "Spring Boot · PostgreSQL",
    description: "브라우저에서 API, 데이터, 배포까지 한 구조로 연결합니다."
  },
  {
    label: "Delivered Work",
    title: "React Native · SMS Automation",
    description: "단독 개발과 납품 경험으로 사용 흐름과 운영 효율을 개선합니다."
  }
];

export const resumeSummary: string[] = [
  "화면 완성도에서 출발했지만 지금은 UI와 서비스 구조를 함께 설계하는 풀스택 엔지니어로 일하고 있습니다.",
  "WebRTC, Spring Boot, AWS, Python 기반 수집·추천 흐름과 React Native 납품 경험을 바탕으로 실제로 동작하는 제품을 만드는 데 강점을 두고 있습니다."
];

export const resumeSignatureTags: string[] = ["UI Polish", "Service Structure", "Delivery Experience"];

export const resumePrinciples: ResumePrinciple[] = [
  {
    title: "Structure First",
    description: "기능보다 먼저 화면, 상태, API, 데이터 흐름을 연결합니다."
  },
  {
    title: "Across the Stack",
    description: "브라우저에서 시작한 흐름이 서버, 데이터베이스, 배포까지 끊기지 않게 봅니다."
  },
  {
    title: "Ship and Refine",
    description: "시연, 납품, 운영 피드백까지 확인한 뒤 다시 다듬습니다."
  }
];

export const resumeFocusGroups: ResumeFocusGroup[] = [
  {
    label: "Frontend",
    title: "제품 화면과 모바일 경험을 구현하는 축",
    items: ["React", "TypeScript", "React Native", "JavaScript", "CSS3"]
  },
  {
    label: "Service Flow",
    title: "API, 데이터, 배포를 연결하는 축",
    items: ["Spring Boot", "Node.js", "PostgreSQL", "AWS EC2/S3", "Flask"]
  },
  {
    label: "Data / Automation",
    title: "수집, 분류, 추천을 확장하는 축",
    items: ["Python", "Playwright", "Puppeteer", "FastAPI", "KoSimCSE", "ETRI OpenAPI"]
  }
];

export const resumeCurrentFocus: string[] = [
  "Spring Boot·PostgreSQL 중심의 서비스 구조를 더 단단하게 다지고 있습니다.",
  "Python과 Playwright/Puppeteer로 수집·정규화·추천 흐름을 확장하고 있습니다.",
  "React Native 경험을 더 정제된 모바일 UX 기준으로 다듬고 있습니다."
];
