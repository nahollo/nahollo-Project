import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { AiFillGithub, AiFillInstagram, AiOutlineTwitter } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { profile } from "../data/profile";

const footerLinks = [
  { to: "/", label: "홈" },
  { to: "/about", label: "소개" },
  { to: "/project", label: "프로젝트" },
  { to: "/resume", label: "이력서" }
];

function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer>
      <Container fluid className="footer">
        <Row className="footer-shell">
          <Col lg="4" md="12" className="footer-copywright footer-brand">
            <span className="footer-label">nahollo</span>
            <h3>fullstack engineer</h3>
            <p>정제된 화면과 서비스 흐름을 함께 설계합니다.</p>
          </Col>
          <Col lg="4" md="12" className="footer-copywright footer-meta">
            <span className="footer-label">Navigate</span>
            <div className="footer-link-row">
              {footerLinks.map((item) => (
                <NavLink key={item.to} to={item.to} className="footer-link">
                  {item.label}
                </NavLink>
              ))}
            </div>
            <h3>Copyright {year} {profile.displayName}</h3>
            <p>Browser → API → Database → Deploy</p>
          </Col>
          <Col lg="4" md="12" className="footer-body">
            <span className="footer-label">Connect</span>
            <ul className="footer-icons">
              <li className="social-icons">
                <a
                  href={profile.social.github}
                  style={{ color: "var(--heading-color)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AiFillGithub />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.twitter}
                  style={{ color: "var(--heading-color)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AiOutlineTwitter />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.linkedin}
                  style={{ color: "var(--heading-color)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedinIn />
                </a>
              </li>
              <li className="social-icons">
                <a
                  href={profile.social.instagram}
                  style={{ color: "var(--heading-color)" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AiFillInstagram />
                </a>
              </li>
            </ul>
            <p>기록은 GitHub와 소셜에 정리했습니다.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
