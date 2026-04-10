import React, { useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { AiOutlineArrowRight } from "react-icons/ai";
import { Link } from "react-router-dom";
import { canvasPalette, homePreviewCards, homeUpdateLog, siteMeta } from "../../data/site";
import { fetchSystemStatus, fetchVisitorStats, SystemStatusResponse, VisitorStatsResponse } from "../../lib/api";

function CanvasMosaic(): JSX.Element {
  const sampleColors = useMemo(() => canvasPalette.slice(0, 16), []);

  return (
    <div className="home-mosaic" aria-hidden="true">
      {sampleColors.map((color) => (
        <span key={color} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function Home(): JSX.Element {
  const [visitorStats, setVisitorStats] = useState<VisitorStatsResponse | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [visitors, system] = await Promise.all([fetchVisitorStats(), fetchSystemStatus()]);

        if (!isMounted) {
          return;
        }

        setVisitorStats(visitors);
        setSystemStatus(system);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setVisitorStats((previous) => previous ?? { today: 0, total: 0 });
      }
    };

    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const homelabLine = systemStatus
    ? `CPU ${systemStatus.cpu.toFixed(0)}% / RAM ${systemStatus.ram.toFixed(0)}% / DISK ${systemStatus.disk.toFixed(0)}%`
    : "홈랩 상태를 불러오는 중입니다.";

  return (
    <section className="playground-page page-home">
      <Container className="playground-shell home-shell">
        <section className="home-hero nahollo-card">
          <div className="home-hero-copy">
            <span className="section-eyebrow">System overview</span>
            <h1 className="home-hero-title">
              <span className="glow-text">nahollo</span>
              <strong>self-hosted personal internet playground</strong>
            </h1>
            <p className="home-hero-description">
              {siteMeta.koreanTagline} 포트폴리오 대신, 직접 만지고 실험하고 남기는 살아 있는 개인 웹 공간으로 다시 만들었습니다.
            </p>

            <div className="home-hero-actions">
              <Link to="/canvas" className="hero-button hero-button-primary">
                캔버스로 가기
                <AiOutlineArrowRight />
              </Link>
              <Link to="/games" className="hero-button hero-button-secondary">
                게임 보기
              </Link>
            </div>

            <div className="home-counter-grid">
              <article className="home-counter-card">
                <span className="home-counter-label">Today visitors</span>
                <strong>{visitorStats ? visitorStats.today.toLocaleString() : "..."}</strong>
              </article>
              <article className="home-counter-card">
                <span className="home-counter-label">Total visitors</span>
                <strong>{visitorStats ? visitorStats.total.toLocaleString() : "..."}</strong>
              </article>
              <article className="home-counter-card wide">
                <span className="home-counter-label">Homelab pulse</span>
                <strong>{homelabLine}</strong>
              </article>
            </div>
          </div>

          <aside className="home-hero-panel">
            <span className="section-eyebrow">Mission</span>
            <ul className="playground-note-list">
              <li>실험 중인 기능이 보이고, 바로 만질 수 있는 개인 인터넷 공간</li>
              <li>완성본을 진열하기보다 현재 진행 중인 흔적이 남는 구조</li>
              <li>캔버스, 게임, 홈랩, 툴이 하나의 살아 있는 시스템처럼 이어지는 경험</li>
            </ul>

            <div className="home-hero-panel-footer">
              <span className="home-status-pill">home server online</span>
              <a href={siteMeta.repoUrl} target="_blank" rel="noreferrer" className="header-link">
                저장소 보기
              </a>
            </div>
          </aside>
        </section>

        <section className="play-section home-preview-section">
          <div className="play-section-head">
            <div>
              <span className="section-eyebrow">Preview</span>
              <h2 className="section-title">지금 들어갈 수 있는 공간</h2>
            </div>
            <p className="section-lead">각 탭은 서로 다른 색과 성격을 갖고 있지만, 하나의 시스템처럼 연결되어 있습니다.</p>
          </div>

          <div className="home-preview-grid">
            {homePreviewCards.map((card) => (
              <article
                key={card.to}
                className="home-preview-card nahollo-card"
                style={
                  {
                    "--tab-accent": card.accent,
                    "--tab-glow": card.glow
                  } as React.CSSProperties
                }
              >
                <div className="home-preview-card-head">
                  <span className="section-eyebrow">{card.eyebrow}</span>
                  <h3 className="glow-text">{card.title}</h3>
                  <p>{card.description}</p>
                </div>

                <div className="home-preview-visual">
                  {card.to === "/canvas" && <CanvasMosaic />}
                  {card.to === "/games" && (
                    <ul className="home-game-preview-list">
                      <li>코드 타이핑</li>
                      <li>서버 점프</li>
                      <li>서버룸 어드벤처</li>
                    </ul>
                  )}
                  {card.to === "/homelab" && (
                    <div className="home-status-preview">
                      <strong>{homelabLine}</strong>
                    </div>
                  )}
                  {card.to === "/tools" && (
                    <div className="home-tool-chip-row">
                      <span>JSON</span>
                      <span>Base64</span>
                      <span>Timestamp</span>
                      <span>UUID</span>
                      <span>Color</span>
                      <span>Markdown</span>
                    </div>
                  )}
                </div>

                <ul className="home-preview-highlight-list">
                  {card.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <Link to={card.to} className="home-inline-link">
                  들어가기
                  <AiOutlineArrowRight />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="play-section home-update-section">
          <div className="play-section-head">
            <div>
              <span className="section-eyebrow">Update log</span>
              <h2 className="section-title">최근 업데이트</h2>
            </div>
            <p className="section-lead">처음에는 하드코딩된 로그지만, 이후에는 실제 배포와 변경 흐름으로 연결할 수 있게 준비했습니다.</p>
          </div>

          <div className="home-log-list">
            {homeUpdateLog.map((item) => (
              <article key={`${item.title}-${item.timestamp}`} className="home-log-item nahollo-card">
                <div className="home-log-meta">
                  <strong>{item.title}</strong>
                  <span>{item.timestamp}</span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </section>
  );
}

export default Home;
