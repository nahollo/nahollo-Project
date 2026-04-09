import React, { useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import bitsOfCode from "../../assets/Projects/blog.png";
import chatify from "../../assets/Projects/chatify.png";
import editor from "../../assets/Projects/codeEditor.png";
import leaf from "../../assets/Projects/leaf.png";
import suicide from "../../assets/Projects/suicide.png";
import { ProjectCategory, projects } from "../../data/projects";
import usePreloadedImages from "../../hooks/usePreloadedImages";
import ProjectCard from "./ProjectCards";

const projectImages = {
  bitsOfCode,
  chatify,
  editor,
  leaf,
  suicide
};

const filters: Array<"All" | ProjectCategory> = ["All", "Fullstack", "AI/Data"];

function Projects(): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const certificatePreviewUrls = useMemo(
    () =>
      projects.flatMap((project) => project.certificates?.map((certificate) => certificate.previewUrl) ?? []),
    []
  );

  usePreloadedImages(certificatePreviewUrls);

  const filterCounts = useMemo(
    () =>
      filters.reduce<Record<(typeof filters)[number], number>>((acc, filter) => {
        acc[filter] = filter === "All" ? projects.length : projects.filter((project) => project.category === filter).length;
        return acc;
      }, {} as Record<(typeof filters)[number], number>),
    []
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === "All") {
      return projects;
    }

    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  const resultsLabel = activeFilter === "All" ? "전체 프로젝트" : `${activeFilter} 프로젝트`;

  return (
    <Container fluid className="project-section">
      <Container>
        <div className="project-shell">
          <section className="project-intro page-intro page-intro-plain" aria-labelledby="project-archive-title">
            <div className="project-intro-head page-intro-head">
              <span className="section-eyebrow project-eyebrow">Project Archive</span>
              <h1 id="project-archive-title" className="project-heading page-title">
                제품처럼 정리한 프로젝트 <strong className="purple">쇼케이스</strong>
              </h1>
              <p className="project-description page-intro-description">
                대표 프로젝트만 빠르게 읽히도록 정리했습니다.
              </p>
            </div>

            <div className="project-intro-controls page-intro-controls">
              <div className="project-filter-panel">
                <div className="project-utility-row">
                  <span className="project-control-label">Filter</span>
                  <div className="project-results-meta page-intro-meta">
                    <span className="project-results-label">{resultsLabel}</span>
                    <strong>{filteredProjects.length} selected builds</strong>
                  </div>
                </div>
                <div className="project-filter-row" role="tablist" aria-label="프로젝트 필터">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === filter}
                      className={`project-filter-tab ${activeFilter === filter ? "is-active" : ""}`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      <span className="project-filter-inner">
                        <span>{filter}</span>
                        <span className="project-filter-count">{filterCounts[filter]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Row className="project-grid">
            {filteredProjects.map((project) => (
              <Col xl={4} md={6} className="project-card" key={project.title}>
                <ProjectCard
                  category={project.category}
                  certificates={project.certificates}
                  date={project.date}
                  demoLabel={project.demoLabel}
                  demoLink={project.demoLink}
                  description={project.description}
                  ghLink={project.ghLink}
                  imgPath={projectImages[project.imageKey]}
                  imagePosition={project.imagePosition}
                  imageScale={project.imageScale}
                  role={project.role}
                  techStack={project.techStack}
                  title={project.title}
                />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </Container>
  );
}

export default Projects;
