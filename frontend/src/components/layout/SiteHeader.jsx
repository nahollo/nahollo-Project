import styles from "./SiteHeader.module.css";

const navItems = [
  { href: "#works", label: "웹 작업" },
  { href: "#devlog", label: "기록" },
  { href: "#games", label: "게임" },
  { href: "#about", label: "소개" }
];

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <a href="#home" className={styles.brand}>
        나홀로전세집
      </a>

      <nav className={styles.nav} aria-label="메인 메뉴">
        {navItems.map((item) => (
          <a key={item.href} className={styles.link} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

