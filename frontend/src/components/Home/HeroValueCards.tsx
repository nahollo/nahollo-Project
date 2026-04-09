import React from "react";

const values = [
  {
    title: "화면 품질",
    description: "타이포그래피, 간격, 대비가 함께 읽히는 화면을 만듭니다."
  },
  {
    title: "읽기 흐름",
    description: "사용자와 협업자가 빠르게 이해할 수 있는 정보 구조를 선호합니다."
  },
  {
    title: "서비스 연결",
    description: "브라우저에서 API, 데이터, 배포까지 이어지는 흐름을 함께 설계합니다."
  }
];

function HeroValueCards(): JSX.Element {
  return (
    <div className="hero-value-grid" aria-label="핵심 가치">
      {values.map((value) => (
        <article className="hero-value-card surface-card" key={value.title}>
          <span className="hero-value-label">quality signal</span>
          <h3 className="hero-value-title">{value.title}</h3>
          <p className="hero-value-text">{value.description}</p>
        </article>
      ))}
    </div>
  );
}

export default HeroValueCards;
