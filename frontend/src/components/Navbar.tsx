import React, { useEffect, useState } from "react";
import { Container, Navbar } from "react-bootstrap";
import { AiOutlineFundProjectionScreen, AiOutlineHome, AiOutlineUser } from "react-icons/ai";
import { BsGithub } from "react-icons/bs";
import { CgFileDocument } from "react-icons/cg";
import { NavLink } from "react-router-dom";
import logoDark from "../assets/logos/logo-dark.png";
import logoLight from "../assets/logos/logo-light.png";
import { profile } from "../data/profile";

const THEME_STORAGE_KEY = "nahollo-theme";

function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 2.7v2.4M12 18.9v2.4M21.3 12h-2.4M5.1 12H2.7M18.56 5.44l-1.7 1.7M7.14 16.86l-1.7 1.7M18.56 18.56l-1.7-1.7M7.14 7.14l-1.7-1.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.7 3.6a8.7 8.7 0 1 0 5.7 14.92A9.45 9.45 0 1 1 14.7 3.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M18.3 6.5v1.3M18.3 11.1V9.8M20.7 8.8h-1.3M16.1 8.8h1.3M20 6.9l-.9.9M16.6 10.3l.9-.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "홈", icon: <AiOutlineHome />, end: true },
  { to: "/about", label: "소개", icon: <AiOutlineUser /> },
  { to: "/project", label: "프로젝트", icon: <AiOutlineFundProjectionScreen /> },
  { to: "/resume", label: "이력서", icon: <CgFileDocument /> }
];

function NavBar(): JSX.Element {
  const [expand, setExpand] = useState(false);
  const [navColour, setNavbar] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const scrollHandler = () => {
      setNavbar(window.scrollY >= 20);
    };

    window.addEventListener("scroll", scrollHandler);

    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setLogoError(false);
  }, [theme]);

  const isDarkMode = theme === "dark";
  const currentLogo = isDarkMode ? logoDark : logoLight;

  return (
    <Navbar expanded={expand} fixed="top" expand="lg" className={`site-header ${navColour ? "sticky" : ""}`}>
      <Container className="navbar-shell">
        <Navbar.Brand as={NavLink} to="/" className="brand-link" onClick={() => setExpand(false)}>
          <span className={`brand-surface ${isDarkMode ? "is-dark" : "is-light"}`}>
            {!logoError ? (
              <>
                <span className="brand-logo-shell">
                  <img
                    src={currentLogo}
                    alt={`${profile.name} logo`}
                    className="brand-logo"
                    width={32}
                    height={32}
                    onError={() => setLogoError(true)}
                  />
                </span>
                <span className="brand-wordmark">{profile.name}</span>
              </>
            ) : (
              <span className="brand-fallback">{profile.name}</span>
            )}
          </span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="responsive-navbar-nav"
          aria-label={expand ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => {
            setExpand((previous) => !previous);
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="responsive-navbar-nav" className="navbar-collapse-shell">
          <nav className="navbar-menu" aria-label="주요 메뉴">
            <div className="navbar-route-list">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setExpand(false)}
                  className={({ isActive }) => `route-link ${isActive ? "is-active" : ""}`}
                >
                  <span className="nav-link-content">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </NavLink>
              ))}
            </div>

            <div className="header-actions">
              <button
                type="button"
                className={`theme-toggle ${isDarkMode ? "dark" : "light"}`}
                onClick={() => {
                  setTheme((previous) => (previous === "dark" ? "light" : "dark"));
                }}
                aria-pressed={isDarkMode}
                aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
              >
                <span className="theme-toggle-track">
                  <span className="theme-toggle-slot theme-toggle-slot-sun" aria-hidden="true">
                    <SunIcon />
                  </span>
                  <span className="theme-toggle-slot theme-toggle-slot-moon" aria-hidden="true">
                    <MoonIcon />
                  </span>
                  <span className="theme-toggle-thumb" aria-hidden="true">
                    <span className="theme-toggle-thumb-icon">{isDarkMode ? <MoonIcon /> : <SunIcon />}</span>
                  </span>
                </span>
              </button>

              <a
                href={profile.portfolioRepo}
                target="_blank"
                rel="noreferrer"
                className="header-link header-link-github"
              >
                <BsGithub />
                <span>GitHub</span>
              </a>
            </div>
          </nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
