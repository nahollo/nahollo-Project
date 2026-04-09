import React from "react";
import Card from "react-bootstrap/Card";
import { profile } from "../../data/profile";

const focusPoints = [
  {
    title: "제품 UI 완성도",
    description: "구조, 간격, 상호작용을 정리해 제품처럼 읽히는 UI를 만듭니다."
  },
  {
    title: "연결되는 서비스 흐름",
    description: "브라우저에서 API, 데이터, 배포까지 이어지는 흐름을 한 구조로 봅니다."
  },
  {
    title: "운영 가능한 개선",
    description: "직접 만들고 검증하며 운영 가능한 구조로 다시 정리합니다."
  }
];

const workPrinciples = [
  "기능보다 먼저 화면 구조와 상태 흐름, API 연결을 정리합니다.",
  "디테일은 취향보다 읽기 쉬운 구조에 맞춥니다.",
  "배운 내용은 다시 구현 가능한 구조로 체화합니다."
];

function AboutCard(): JSX.Element {
  return (
    <Card className="quote-card-view about-main-card">
      <Card.Body>
        <div className="about-card-shell">
          <div className="about-card-block">
            <span className="about-card-label">Profile</span>
            <p className="about-card-intro">
              안녕하세요. 저는 <span className="purple">{profile.displayName}</span>입니다. 화면의 완성도에서 출발해 지금은 UI와
              서비스 흐름을 함께 설계합니다.
            </p>
          </div>

          <div className="about-focus-grid">
            {focusPoints.map((item) => (
              <article className="about-focus-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="about-card-block">
            <span className="about-card-label">How I Build</span>
            <ul className="about-activity-list">
              {workPrinciples.map((item) => (
                <li className="about-activity" key={item}>
                  <span className="about-activity-bullet" aria-hidden="true"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="about-card-quote">
            보이는 결과물만이 아니라 실제로 이어지고 운영되는 구조를 만들고 싶습니다.
          </p>
          <footer className="blockquote-footer">— {profile.displayName}</footer>
        </div>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
