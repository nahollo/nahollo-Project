import React from "react";
import { Container } from "react-bootstrap";
import { NavLink } from "react-router-dom";

const gameLinks = [
  { to: "/games", label: "게임 홈", end: true },
  { to: "/games/typing", label: "코드 타이핑" },
  { to: "/games/jump", label: "서버 점프" },
  { to: "/games/adventure", label: "서버룸 어드벤처" }
];

function GamesShell({
  title,
  description,
  children
}: {
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="playground-page page-games">
      <Container className="playground-shell games-shell">
        <header className="page-intro">
          <div className="page-intro-head">
            <span className="section-eyebrow">Games</span>
            <h1 className="page-title glow-text">{title}</h1>
            <p className="page-intro-description">{description}</p>
          </div>
        </header>

        <nav className="games-subnav" aria-label="Games navigation">
          {gameLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `games-subnav-link ${isActive ? "is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="games-shell-body">{children}</div>
      </Container>
    </section>
  );
}

export default GamesShell;
