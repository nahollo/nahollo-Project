export interface AwardItem {
  description: string;
  label: string;
  previewUrl: string;
  title: string;
  url: string;
  year: string;
}

export const standaloneAwards: AwardItem[] = [
  {
    title: "교육과정 산출물 우수상",
    label: "Academic",
    year: "2023.12",
    description: "프로젝트 수행 과정과 결과를 균형 있게 정리해 교육과정 안에서의 성장과 완성도를 보여준 기록입니다.",
    previewUrl: "/certificates/previews/sonagi-academic-excellence.png",
    url: "/certificates/sonagi-academic-excellence.pdf"
  },
  {
    title: "SW 알고리즘 경진대회 동상",
    label: "Problem Solving",
    year: "2023.11",
    description: "서비스 개발 바깥에서도 문제 해결 기본기와 구현 감각을 꾸준히 다듬어온 흐름을 보여주는 상장입니다.",
    previewUrl: "/certificates/previews/noyakzone-algorithm-award.png",
    url: "/certificates/noyakzone-algorithm-award.pdf"
  }
];
