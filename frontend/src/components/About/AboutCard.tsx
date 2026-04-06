import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";
import { profile } from "../../data/profile";

const focusPoints = [
  {
    title: "제품 UI 완성도",
    description: "React와 TypeScript를 중심으로 화면 구조, 간격, 상호작용을 정리해 제품처럼 읽히는 UI를 만드는 데 집중합니다."
  },
  {
    title: "연결되는 서비스 흐름",
    description: "브라우저에서 API, 데이터베이스, 배포까지 이어지는 흐름을 하나의 서비스 문제로 보고 설계합니다."
  },
  {
    title: "운영 가능한 개선",
    description: "실습 프로젝트와 홈서버 운영을 통해 직접 만들고 검증하며, 실제로 돌아가는 구조로 다시 다듬습니다."
  }
];

const workPrinciples = [
  "기능을 붙이기 전에 화면 구조와 상태 흐름, API 연결을 먼저 정리합니다.",
  "사용자에게 보이는 디테일은 취향보다 읽기 쉬움과 목적성에 맞춥니다.",
  "학습한 내용은 다시 구현 가능한 구조로 바꾸어 체화합니다."
];

function AboutCard(): JSX.Element {
  return (
    <Card className="quote-card-view about-main-card">
      <Card.Body>
        <div className="about-card-shell">
          <div className="about-card-block">
            <span className="about-card-label">Profile</span>
            <p className="about-card-intro">
              안녕하세요. 저는 <span className="purple">{profile.name}</span>입니다. 화면의 완성도에서 출발했지만, 지금은 UI 품질과
              정보 구조, API와 데이터 흐름까지 함께 설계하는 풀스택 엔지니어를 지향합니다.
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

          <p className="about-card-quote">보이는 결과만이 아니라, 실제로 이어지고 유지되는 구조를 만드는 엔지니어가 되고 싶습니다.</p>
          <footer className="blockquote-footer">- {profile.name}</footer>
        </div>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
