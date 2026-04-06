import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Aboutcard from "./AboutCard";
import Github from "./Github";
import Techstack from "./Techstack";
import Toolstack from "./Toolstack";

function About(): JSX.Element {
  return (
    <>
      <Container fluid className="about-section">
        <Container>
          <section className="about-page-intro page-intro">
            <div className="about-intro-copy page-intro-head">
              <span className="section-eyebrow">About nahollo</span>
              <h1 className="about-title page-title">화면 품질과 서비스 구조를 함께 설계하는 이유를 설명합니다.</h1>
              <p className="about-intro-description page-intro-description">
                홈이 포지셔닝을 보여주는 페이지라면, 여기는 어떤 기준으로 만들고 어떤 방향으로 확장하고 있는지 더 깊게
                보여주는 소개 페이지입니다.
              </p>
            </div>
          </section>

          <Row className="about-intro-grid">
            <Col lg={7}>
              <Aboutcard />
            </Col>
            <Col lg={5}>
              <div className="about-side-panel surface-card">
                <span className="about-side-label">Work Style</span>
                <h3>소개보다 근거에 가까운 작업 기준을 정리해둔 페이지입니다.</h3>
                <p>
                  보기 좋은 화면처럼 보이는지보다, 실제 사용 흐름과 유지보수 기준까지 함께 설계되어 있는지를 더 중요하게
                  봅니다.
                </p>

                <div className="about-side-list">
                  <article className="about-side-item">
                    <strong>Structure First</strong>
                    <span>화면, 상태, API 연결 지점을 먼저 정리한 뒤 디테일을 다듬습니다.</span>
                  </article>
                  <article className="about-side-item">
                    <strong>Polish with Purpose</strong>
                    <span>spacing, typography, contrast 같은 작은 차이로 완성도를 끌어올립니다.</span>
                  </article>
                  <article className="about-side-item">
                    <strong>Build and Verify</strong>
                    <span>홈서버와 실습 프로젝트로 실제 동작하는 흐름을 계속 점검합니다.</span>
                  </article>
                </div>

                <div className="about-side-tags">
                  <span>구조 설계</span>
                  <span>가독성</span>
                  <span>운영 감각</span>
                  <span>지속적인 개선</span>
                </div>
              </div>
            </Col>
          </Row>

          <section className="about-capability-section">
            <div className="about-section-head">
              <span className="section-eyebrow">Capability Map</span>
              <h2 className="section-title">현재 강하게 가져가는 기술과 확장 중인 범위를 한 구조 안에서 보여드립니다.</h2>
              <p className="section-lead">
                모든 기술을 같은 무게로 나열하지 않고, 실제 작업 우선순위와 맥락에 맞게 다시 정리했습니다.
              </p>
            </div>
            <Techstack />
          </section>

          <section className="about-tools-section">
            <div className="about-section-head">
              <span className="section-eyebrow">Workflow</span>
              <h2 className="section-title">매일 다루는 환경과 확인 루틴도 제품 작업 흐름 안에서 관리합니다.</h2>
              <p className="section-lead">편집, 브라우저 확인, 점검 도구까지 하나의 작업 리듬으로 이어지도록 정리합니다.</p>
            </div>
            <Toolstack />
          </section>

          <Github />
        </Container>
      </Container>
    </>
  );
}

export default About;
