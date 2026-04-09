import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

const principles = ["계층", "읽기 흐름", "시스템 일관성", "배포 감각"];

const workingPoints = [
  {
    title: "화면이 먼저 읽히는지 확인합니다",
    description: "강한 제목, 안정적인 여백, 분명한 행동 우선순위가 한 번에 보이는 구성을 선호합니다."
  },
  {
    title: "구조가 끝까지 이어지는지 봅니다",
    description: "브라우저에서 시작한 흐름이 API와 데이터, 운영 관점까지 자연스럽게 이어지도록 정리합니다."
  },
  {
    title: "출시 밀도로 다듬습니다",
    description: "보기 좋은 시안보다 실제로 읽히고 유지되는 결과물에 더 높은 기준을 둡니다."
  }
];

function Home2(): JSX.Element {
  return (
    <Container fluid className="home-about-section" id="approach">
      <Container>
        <Row className="home-about-grid">
          <Col lg={7} className="home-about-description">
            <div className="section-copy-block">
              <span className="section-eyebrow">Working Model</span>
              <h2 className="section-title">단정한 결과물과 끝까지 이어지는 구조를 지향합니다.</h2>
              <p className="section-lead">홈에서는 작업 기준만 짧게 보여줍니다.</p>

              <div className="about-copy-flow">
                <p className="home-about-body">
                  좋은 제품 UI는 말이 많지 않아도 방향과 다음 행동이 자연스럽게 읽혀야 한다고 생각합니다.
                </p>
              </div>

              <div className="about-principles">
                {principles.map((item) => (
                  <span className="about-principle-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              <div className="about-preview-actions">
                <Link to="/about" className="about-preview-link">
                  소개 페이지에서 작업 기준 보기
                </Link>
              </div>
            </div>
          </Col>

          <Col lg={5}>
            <div className="profile-surface surface-card">
              <div className="surface-card-head">
                <span className="profile-surface-label">What I Optimize</span>
                <h3>작업 전에 먼저 보는 품질 기준입니다.</h3>
              </div>

              <p className="profile-surface-copy">
                보기 좋은지보다 읽히고, 이어지고, 유지되는지를 먼저 점검합니다.
              </p>

              <ul className="profile-point-list">
                {workingPoints.map((point) => (
                  <li key={point.title}>
                    <strong>{point.title}</strong>
                    <span>{point.description}</span>
                  </li>
                ))}
              </ul>

              <div className="surface-card-footer">
                <span>About에서 이어지는 내용</span>
                <strong>정체성 · 작업 기준 · 기술 우선순위</strong>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Home2;
