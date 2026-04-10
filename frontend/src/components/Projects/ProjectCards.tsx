import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { BsGithub } from "react-icons/bs";
import { CgWebsite } from "react-icons/cg";
import CertificateModal from "../CertificateModal";
import { ProjectCategory, ProjectCertificate } from "../../data/projects";

interface ProjectCardsProps {
  category: ProjectCategory;
  certificates?: ProjectCertificate[];
  date: string;
  demoLabel?: string;
  demoLink?: string;
  description: string;
  ghLink: string;
  imgPath: string;
  imagePosition?: string;
  imageScale?: number;
  role: string;
  techStack: string[];
  title: string;
}

function ProjectCards({
  category,
  certificates = [],
  date,
  demoLabel = "Live Demo",
  demoLink,
  description,
  ghLink,
  imgPath,
  imagePosition = "center top",
  imageScale = 1.06,
  role,
  techStack,
  title
}: ProjectCardsProps): JSX.Element {
  const [activeCertificate, setActiveCertificate] = useState<ProjectCertificate | null>(null);
  const projectLabel = `${title} ${date} ${category}`;

  return (
    <>
      <Card className="project-card-view project-showcase-card" aria-label={projectLabel}>
        <div className="project-card-media">
          <img
            src={imgPath}
            alt={title}
            className="project-card-image"
            style={{
              objectPosition: imagePosition,
              ["--project-image-scale" as string]: imageScale
            }}
          />
        </div>

        <Card.Body className="project-card-body">
          <div className="project-card-header">
            <div className="project-card-title-row">
              <Card.Title className="project-card-title">{title}</Card.Title>
              <span className="project-card-date">{date}</span>
            </div>

            <div className="project-card-heading">
              <div className="project-card-meta-cluster">
                <span className="project-card-category">{category}</span>
                <span className="project-card-role">{role}</span>
              </div>
            </div>
          </div>

          <div className="project-card-body-chunk">
            <Card.Text className="project-card-description">{description}</Card.Text>

            <div className="project-card-stack" aria-label={`${title} tech stack`}>
              {techStack.map((item) => (
                <span className="project-card-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>

            {certificates.length > 0 && (
              <div className="project-card-awards">
                <span className="project-card-awards-label">Awards</span>
                <div className="project-card-awards-list">
                  {certificates.map((certificate) => (
                    <button
                      key={certificate.url}
                      type="button"
                      className="project-award-button"
                      onClick={() => setActiveCertificate(certificate)}
                    >
                      {certificate.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="project-card-actions">
              {demoLink && (
                <a
                  href={demoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="project-action-link project-action-link-demo"
                >
                  <CgWebsite />
                  <span>{demoLabel}</span>
                </a>
              )}

              <a href={ghLink} target="_blank" rel="noreferrer" className="project-action-link">
                <BsGithub />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </Card.Body>
      </Card>

      {activeCertificate && (
        <CertificateModal
          label={activeCertificate.label}
          url={activeCertificate.url}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </>
  );
}

export default ProjectCards;
