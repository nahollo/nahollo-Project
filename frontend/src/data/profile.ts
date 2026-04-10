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
  headline: "UI 품질과 서비스 구조를 함께 설계하는 풀스택 엔지니어",
  summary:
    "React와 TypeScript로 완성도 높은 화면을 만들고, Spring Boot와 PostgreSQL로 이어지는 API와 데이터 흐름까지 한 제품 안에서 설계하는 풀스택 엔지니어입니다.",
  portfolioRepo: "https://github.com/nahollo/portfolio",
  roleHeadlines: ["제품 UI 설계", "서비스 흐름 구현", "운영까지 보는 개발"],
  social: {
    github: "https://github.com/nahollo",
    twitter: "https://twitter.com/nahollo",
    linkedin: "https://www.linkedin.com/in/nahollo/",
    instagram: "https://www.instagram.com/nahollo"
  }
};
