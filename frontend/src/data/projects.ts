export type ProjectCategory = "Frontend" | "Fullstack" | "AI/Data";

export interface ProjectItem {
  category: ProjectCategory;
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
    title: "Chatify",
    date: "2024",
    category: "Fullstack",
    role: "실시간 채팅 경험 · Firebase 연동",
    techStack: ["React", "Material UI", "Firebase"],
    description:
      "실시간 메시지, 이미지 공유, 반응형 레이아웃까지 이어지는 채팅 경험을 구현한 프로젝트입니다. 인터랙션 완성도와 Firebase 기반 데이터 흐름을 함께 다뤘습니다.",
    ghLink: "https://github.com/nahollo/Chatify",
    demoLink: "https://chatify-49.web.app/",
    demoLabel: "Live Demo",
    imageScale: 1.26,
    imagePosition: "center top"
  },
  {
    imageKey: "bitsOfCode",
    title: "Bits of Code",
    date: "2024",
    category: "Frontend",
    role: "콘텐츠 중심 기술 블로그",
    techStack: ["Next.js", "Tailwind CSS", "Markdown"],
    description:
      "마크다운 기반 글 작성과 깔끔한 읽기 경험에 집중한 개인 기술 블로그입니다. 콘텐츠 구조와 읽기 밀도를 정리하는 데 초점을 맞췄습니다.",
    ghLink: "https://github.com/nahollo/Bits-0f-C0de",
    imageScale: 1.2,
    imagePosition: "center top"
  },
  {
    imageKey: "editor",
    title: "Editor.io",
    date: "2023",
    category: "Frontend",
    role: "경량 에디터 UX · 로컬 저장",
    techStack: ["React", "Markdown", "LocalStorage"],
    description:
      "즉시 미리보기와 로컬 자동 저장을 지원하는 코드 · 마크다운 에디터입니다. 빠른 작성 흐름과 가벼운 편집 경험을 목표로 만들었습니다.",
    ghLink: "https://github.com/nahollo/Editor.io",
    imageScale: 1.28,
    imagePosition: "center top"
  },
  {
    imageKey: "leaf",
    title: "Plant AI",
    date: "2022",
    category: "AI/Data",
    role: "식물 질병 분류 실험",
    techStack: ["PyTorch", "CNN", "Computer Vision"],
    description:
      "CNN 기반으로 식물 이미지를 분류하고 건강 상태를 예측하는 프로젝트입니다. 모델 학습과 결과 해석을 함께 다루며 AI 실험 흐름을 익혔습니다.",
    ghLink: "https://github.com/nahollo/Plant_AI",
    demoLink: "https://plant49-ai.herokuapp.com/",
    demoLabel: "Live Demo",
    imageScale: 1.24,
    imagePosition: "center 38%"
  },
  {
    imageKey: "suicide",
    title: "AI for Social Good",
    date: "2022",
    category: "AI/Data",
    role: "텍스트 분류 · 사회문제 탐지",
    techStack: ["NLP", "Classification", "Python"],
    description:
      "온라인 게시글에서 위험 신호를 조기에 감지하기 위해 자연어 처리 기반 분류 실험을 진행한 프로젝트입니다. 데이터 전처리부터 분류 흐름까지 연결했습니다.",
    ghLink: "https://github.com/nahollo/AI_For_Social_Good",
    imageScale: 1.22,
    imagePosition: "center 26%"
  },
  {
    imageKey: "emotion",
    title: "얼굴 인식 및 감정 분석",
    date: "2021",
    category: "AI/Data",
    role: "OpenCV · FER-2013 기반 분석",
    techStack: ["OpenCV", "FER-2013", "Deep Learning"],
    description:
      "FER-2013 기반 감정 분류 모델과 얼굴 인식 흐름을 결합해 표정과 감정을 분석한 프로젝트입니다. 비전 모델 실험과 추론 파이프라인을 함께 다뤘습니다.",
    ghLink: "https://github.com/nahollo/Face_And_Emotion_Detection",
    imageScale: 1.22,
    imagePosition: "center 34%"
  }
];
