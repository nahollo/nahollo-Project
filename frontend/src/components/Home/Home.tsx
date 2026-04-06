import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { AiFillGithub, AiFillInstagram, AiOutlineArrowRight, AiOutlineTwitter } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";
import { profile } from "../../data/profile";
import HeroSummaryCard from "./HeroSummaryCard";
import HeroValueCards from "./HeroValueCards";
import Home2 from "./Home2";
import Type from "./Type";

function Home(): JSX.Element {
  return (
    <section>
      <Container fluid className="home-section" id="home">
        <Container className="home-content">
          <Row className="hero-grid">
            <Col xl={7} lg={7} className="home-header">
              <div className="hero-copy">
                <span className="hero-eyebrow">nahollo portfolio</span>

                <div className="hero-title-stack">
                  <p className="hero-greeting">
                    안녕하세요
                    <span className="wave" role="img" aria-label="waving hand">
                      {"\uD83D\uDC4B"}
                    </span>
                  </p>

                  <h1 className="hero-heading">
                    <span className="hero-heading-line">
                      저는 <span className="main-name">{profile.displayName}</span>입니다.
                    </span>
                    <span className="hero-heading-subline">
                      제품처럼 설계된 웹 경험을 만들고,
                      <br className="hero-heading-break" />
                      서비스 흐름까지 연결합니다.
                    </span>
                  </h1>
                </div>

                <div className="hero-type-shell">
                  <span className="hero-type-label">포지셔닝</span>
                  <div className="hero-type">
                    <Type />
                  </div>
                </div>

                <p className="hero-description">{profile.summary}</p>

                <div className="hero-actions">
                  <Link to="/project" className="hero-button hero-button-primary">
                    프로젝트 아카이브 보기
                    <AiOutlineArrowRight />
                  </Link>
                  <Link to="/about" className="hero-button hero-button-secondary">
                    소개 자세히 보기
                  </Link>
                </div>

                <p className="hero-inline-note">
                  작업 흔적은 <a href={profile.social.github}>GitHub</a>에서, 구조화된 소개는 <Link to="/resume">이력서</Link>에서
                  빠르게 확인할 수 있습니다.
                </p>

                <HeroValueCards />
              </div>
            </Col>

            <Col xl={5} lg={5} className="hero-panel-col">
              <HeroSummaryCard />
            </Col>
          </Row>
        </Container>
      </Container>

      <Home2 />

      <Container className="connect-shell">
        <div className="connect-card surface-card">
          <div className="connect-copy">
            <span className="section-eyebrow">Open Work</span>
            <h2>브라우저에서 배포까지 이어지는 작업 기록을 열어두고 있습니다.</h2>
            <p>프로젝트 아카이브는 결과물 중심으로, GitHub와 이력서는 작업 방식과 성장 흐름 중심으로 정리해두었습니다.</p>

            <div className="connect-actions">
              <Link to="/resume" className="connect-button connect-button-secondary">
                이력서 보기
              </Link>
              <a
                href={profile.social.github}
                target="_blank"
                rel="noreferrer"
                className="connect-button connect-button-primary"
              >
                GitHub 기록 보기
                <AiOutlineArrowRight />
              </a>
            </div>
          </div>

          <div className="connect-side">
            <div className="connect-side-card">
              <span className="connect-side-label">Open For</span>
              <div className="connect-side-tags">
                <span>Frontend UI</span>
                <span>Fullstack Collaboration</span>
                <span>Service Flow Thinking</span>
              </div>
              <p className="connect-side-note">Browser -&gt; API -&gt; Database -&gt; Deploy</p>
            </div>

            <ul className="connect-social-list">
              <li className="social-icons">
                <a
                  href={profile.social.github}
                  target="_blank"
                  rel="noreferrer"
                  className="connect-social-link"
                >
                  <AiFillGithub />
                  <span>GitHub</span>
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="connect-social-link"
                >
                  <AiOutlineTwitter />
                  <span>Twitter</span>
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="connect-social-link"
                >
                  <FaLinkedinIn />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="connect-social-link"
                >
                  <AiFillInstagram />
                  <span>Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Home;
