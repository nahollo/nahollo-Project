import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";
import { profile } from "../../data/profile";

const focusPoints = [
  {
    title: "UI 품질 중심",
    description: "React와 TypeScript를 중심으로 계층, 간격, 상호작용이 정리된 화면을 만드는 데 집중합니다."
  },
  {
    title: "연결되는 서비스 흐름",
    description: "브라우저에서 API, 데이터, 배포까지 이어지는 흐름을 한 제품의 문제로 보고 다룹니다."
  },
  {
    title: "운영 가능한 개선",
    description: "홈서버와 실습 프로젝트를 통해 직접 만들고 점검하며, 출시 가능한 밀도로 다시 다듬습니다."
  }
];

const workPrinciples = [
  "기능을 붙이기 전에 화면 계층과 상태 흐름을 먼저 정리합니다.",
  "디자인 디테일은 취향보다 읽기 쉬움과 목적성에 맞춥니다.",
  "학습한 내용은 다시 구현 가능한 구조로 바꿔서 체화합니다."
];

function AboutCard(): JSX.Element {
  return (
    <Card className="quote-card-view about-main-card">
      <Card.Body>
        <div className="about-card-shell">
          <div className="about-card-block">
            <span className="about-card-label">Profile</span>
            <p className="about-card-intro">
              안녕하세요. 저는 <span className="purple">{profile.name}</span>입니다. 프론트엔드에서 시작한 관심을 UI 품질,
              정보 구조, 서비스 흐름으로 확장하며 제품처럼 설계된 웹 경험을 만드는 엔지니어를 지향합니다.
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
                  <ImPointRight />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="about-card-quote">“좋아 보이는 결과보다, 실제로 읽히고 유지되는 구조를 더 오래 남기고 싶습니다.”</p>
          <footer className="blockquote-footer">— {profile.name}</footer>
        </div>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
