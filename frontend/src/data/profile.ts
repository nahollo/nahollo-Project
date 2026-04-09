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
  displayName: "나형진",
  githubUsername: "nahollo",
  headline: "화면과 서비스 구조를 함께 설계하는 풀스택 엔지니어",
  summary:
    "React와 TypeScript, React Native로 화면을 만들고 Spring Boot와 PostgreSQL로 이어지는 API\u00A0·\u00A0데이터 흐름까지 설계합니다.",
  portfolioRepo: "https://github.com/nahollo/nahollo-Project",
  roleHeadlines: ["제품 UI 설계", "서비스 흐름 구현", "납품·운영 경험"],
  social: {
    github: "https://github.com/nahollo",
    twitter: "https://twitter.com/nahollo",
    linkedin: "https://www.linkedin.com/in/nahollo/",
    instagram: "https://www.instagram.com/nahollo"
  }
};
