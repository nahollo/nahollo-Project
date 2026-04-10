import React from "react";

const summaryHighlights = [
  {
    label: "UI Systems",
    title: "React · TypeScript",
    description: "계층과 읽기 흐름이 또렷한 인터페이스를 제품 기준으로 설계합니다."
  },
  {
    label: "Service Flow",
    title: "Spring Boot · PostgreSQL",
    description: "브라우저 밖까지 이어지는 요청, 데이터, 운영 감각을 함께 다룹니다."
  }
];

function HeroSummaryCard(): JSX.Element {
  return (
    <div className="hero-summary-card surface-card">
      <div className="summary-head">
        <div className="summary-head-copy">
          <span className="hero-panel-label">Core Snapshot</span>
          <h3 className="summary-title">브라우저에서 배포까지, 한 제품의 흐름으로 정리합니다.</h3>
        </div>
        <span className="hero-panel-status">production-minded</span>
      </div>

      <p className="summary-copy">
        UI 품질만 좋아 보이는 결과보다, API와 데이터 흐름까지 자연스럽게 이어지는 서비스 구조를 더 중요하게 봅니다.
      </p>

      <div className="summary-chip-list" aria-label="주요 기술">
        <span className="summary-chip">React</span>
        <span className="summary-chip">TypeScript</span>
        <span className="summary-chip">Spring Boot</span>
        <span className="summary-chip">PostgreSQL</span>
      </div>

      <div className="summary-highlight-grid">
        {summaryHighlights.map((highlight) => (
          <article className="summary-highlight-card" key={highlight.label}>
            <span>{highlight.label}</span>
            <strong>{highlight.title}</strong>
            <p>{highlight.description}</p>
          </article>
        ))}
      </div>

      <div className="summary-flow-card">
        <span>Delivery Perspective</span>
        <strong>Browser → API → Database → Deploy</strong>
        <p>읽기 쉬운 화면, 안정적인 상태 흐름, 운영 가능한 구조가 한 방향을 보도록 만드는 데 가치를 둡니다.</p>
      </div>
    </div>
  );
}

export default HeroSummaryCard;
