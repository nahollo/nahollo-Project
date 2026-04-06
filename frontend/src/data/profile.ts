interface Profile {
  displayName: string;
  githubUsername: string;
  headline: string;
  name: string;
  portfolioRepo: string;
  roleHeadlines: string[];
  social: {
    github: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  summary: string;
}

export const profile: Profile = {
  name: "nahollo",
  displayName: "nahollo",
  githubUsername: "nahollo",
  headline: "UI 품질과 서비스 구조를 함께 설계하는 프론트엔드 · 풀스택 엔지니어",
  summary:
    "React와 TypeScript로 완성도 높은 화면을 만들고, Spring Boot와 PostgreSQL로 이어지는 API\u00A0·\u00A0데이터 흐름까지 한 제품의 맥락에서 설계합니다.",
  portfolioRepo: "https://github.com/nahollo/portfolio",
  roleHeadlines: ["UI 품질 중심", "서비스 흐름 설계", "운영까지 보는 구현"],
  social: {
    github: "https://github.com/nahollo",
    twitter: "https://twitter.com/nahollo",
    linkedin: "https://www.linkedin.com/in/nahollo/",
    instagram: "https://www.instagram.com/nahollo"
  }
};
