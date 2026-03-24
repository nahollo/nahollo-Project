import SiteHeader from "../components/layout/SiteHeader.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import HeroIntro from "../components/home/HeroIntro.jsx";
import RecentWorksSection from "../components/home/RecentWorksSection.jsx";
import DevlogSection from "../components/home/DevlogSection.jsx";
import GamesSection from "../components/home/GamesSection.jsx";
import { devlogs, games, recentWorks } from "../data/homeContent.js";
import styles from "./HomePage.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <SiteHeader />
        <HeroIntro />
        <RecentWorksSection works={recentWorks} />
        <DevlogSection entries={devlogs} />
        <GamesSection games={games} />
        <SiteFooter />
      </main>
    </div>
  );
}

