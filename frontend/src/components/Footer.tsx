import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { AiFillGithub, AiFillInstagram, AiOutlineTwitter } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { mainNavigation, siteMeta } from "../data/site";

function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer>
      <Container fluid className="footer">
        <Row className="footer-shell">
          <Col lg="4" md="12" className="footer-copywright footer-brand">
            <span className="footer-label">nahollo</span>
            <h3>self-hosted internet playground</h3>
            <p>실험하고, 놀고, 기록을 남기는 개인 인터넷 공간입니다.</p>
          </Col>
          <Col lg="4" md="12" className="footer-copywright footer-meta">
            <span className="footer-label">Navigate</span>
            <div className="footer-link-row">
              {mainNavigation.map((item) => (
                <NavLink key={item.to} to={item.to} className="footer-link">
                  {item.label}
                </NavLink>
              ))}
            </div>
            <h3>
              Copyright {year} {siteMeta.name}
            </h3>
            <p>Canvas · Games · Homelab · Tools</p>
          </Col>
          <Col lg="4" md="12" className="footer-body">
            <span className="footer-label">Connect</span>
            <ul className="footer-icons">
              <li className="social-icons">
                <a href={siteMeta.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <AiFillGithub className="footer-social-icon footer-social-icon-github" />
                </a>
              </li>
              <li className="social-icons">
                <a href={siteMeta.social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <AiOutlineTwitter className="footer-social-icon footer-social-icon-twitter" />
                </a>
              </li>
              <li className="social-icons">
                <a href={siteMeta.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FaLinkedinIn className="footer-social-icon footer-social-icon-linkedin" />
                </a>
              </li>
              <li className="social-icons">
                <a href={siteMeta.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <AiFillInstagram className="footer-social-icon footer-social-icon-instagram" />
                </a>
              </li>
            </ul>
            <p>필요한 연결만 남기고, 나머지는 페이지 안에서 직접 체험하도록 구성했습니다.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
