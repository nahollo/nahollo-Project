export interface AwardItem {
  description: string;
  label: string;
  title: string;
  url: string;
  year: string;
}

export const standaloneAwards: AwardItem[] = [
  {
    title: "몰입형 성적우수",
    label: "Academic",
    year: "2023",
    description: "프로젝트 성과와 별개로, 교육과정 안에서의 성적 우수 성과를 보여주는 기록입니다.",
    url: "/certificates/sonagi-academic-excellence.pdf"
  },
  {
    title: "알고리즘",
    label: "Problem Solving",
    year: "2024",
    description: "서비스 프로젝트 외에도 문제 해결과 구현 기본기를 꾸준히 쌓아온 흐름을 보여주는 상장입니다.",
    url: "/certificates/noyakzone-algorithm-award.pdf"
  }
];
