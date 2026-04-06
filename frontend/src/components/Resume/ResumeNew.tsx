import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { AiOutlineArrowRight } from "react-icons/ai";
import { BsGithub } from "react-icons/bs";
import { Link } from "react-router-dom";
import CertificateModal from "../CertificateModal";
import { standaloneAwards } from "../../data/awards";
import { profile } from "../../data/profile";
import { projects } from "../../data/projects";
import {
  resumeCurrentFocus,
  resumeFocusGroups,
  resumeHighlights,
  resumePrinciples,
  resumeSignatureTags,
  resumeSummary
} from "../../data/resume";

const selectedProjects = projects.slice(0, 3);

function ResumeNew(): JSX.Element {
  const [activeAward, setActiveAward] = React.useState<(typeof standaloneAwards)[number] | null>(null);

  return (
    <>
      <Container fluid className="resume-section">
        <Container className="resume-shell">
        <section className="resume-intro page-intro">
          <div className="resume-intro-copy page-intro-head">
            <span className="section-eyebrow">Resume</span>
            <h1 className="resume-title page-title">정제된 UI와 서비스 흐름을 함께 설계하는 풀스택 엔지니어입니다.</h1>
            <p className="resume-intro-description page-intro-description">
              이력서는 문서보다 빠르게 스캔되고 비교되어야 한다고 생각합니다. 그래서 현재 집중하는 역량, 작업 방식, 대표 프로젝트,
              그리고 확장 중인 기술 흐름을 웹 네이티브 형태로 다시 정리했습니다.
            </p>
          </div>

          <div className="resume-actions">
            <Link to="/project" className="resume-action resume-action-primary">
              프로젝트 아카이브 보기
              <AiOutlineArrowRight />
            </Link>
            <a href={profile.social.github} target="_blank" rel="noreferrer" className="resume-action resume-action-secondary">
              <BsGithub />
              <span>GitHub 프로필</span>
            </a>
          </div>

          <div className="resume-highlight-grid">
            {resumeHighlights.map((highlight) => (
              <article className="resume-highlight-card surface-card" key={highlight.label}>
                <span className="resume-highlight-label">{highlight.label}</span>
                <strong>{highlight.title}</strong>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <Row className="resume-content-grid">
          <Col xl={7} lg={7} className="resume-main-column">
            <article className="resume-panel surface-card">
              <span className="resume-panel-label">Profile Summary</span>
              <div className="resume-summary-flow">
                {resumeSummary.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="resume-summary-tags">
                {resumeSignatureTags.map((item) => (
                  <span className="resume-summary-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="resume-panel surface-card">
              <div className="resume-panel-head">
                <span className="resume-panel-label">Selected Projects</span>
                <Link to="/project" className="resume-inline-link">
                  전체 프로젝트 보기
                </Link>
              </div>

              <div className="resume-project-list">
                {selectedProjects.map((project) => (
                  <article className="resume-project-item" key={project.title}>
                    <div className="resume-project-meta">
                      <span>{project.role}</span>
                      <strong>{project.date}</strong>
                    </div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="resume-project-stack">
                      {project.techStack.map((tech) => (
                        <span className="resume-project-chip" key={tech}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </Col>

          <Col xl={5} lg={5} className="resume-side-column">
            <article className="resume-panel surface-card">
              <span className="resume-panel-label">How I Work</span>
              <div className="resume-principle-list">
                {resumePrinciples.map((principle) => (
                  <article className="resume-principle-item" key={principle.title}>
                    <strong>{principle.title}</strong>
                    <p>{principle.description}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="resume-panel surface-card">
              <span className="resume-panel-label">Capability Structure</span>
              <div className="resume-focus-groups">
                {resumeFocusGroups.map((group) => (
                  <section className="resume-focus-group" key={group.label}>
                    <span className="resume-focus-label">{group.label}</span>
                    <h3>{group.title}</h3>
                    <div className="resume-focus-chips">
                      {group.items.map((item) => (
                        <span className="resume-focus-chip" key={item}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <article className="resume-panel surface-card">
              <span className="resume-panel-label">Current Focus</span>
              <ul className="resume-focus-list">
                {resumeCurrentFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="resume-panel surface-card">
              <span className="resume-panel-label">Awards & Certificates</span>
              <div className="resume-awards-list">
                {standaloneAwards.map((award) => (
                  <button
                    key={award.url}
                    type="button"
                    className="resume-award-item"
                    onClick={() => setActiveAward(award)}
                  >
                    <div className="resume-award-meta">
                      <span>{award.label}</span>
                      <strong>{award.year}</strong>
                    </div>
                    <h3>{award.title}</h3>
                    <p>{award.description}</p>
                  </button>
                ))}
              </div>
            </article>
          </Col>
        </Row>
        </Container>
      </Container>

      {activeAward && (
        <CertificateModal label={activeAward.title} url={activeAward.url} onClose={() => setActiveAward(null)} />
      )}
    </>
  );
}

export default ResumeNew;
