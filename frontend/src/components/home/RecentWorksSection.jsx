import SectionTitle from "../content/SectionTitle.jsx";
import WorkPaper from "../content/WorkPaper.jsx";
import styles from "./RecentWorksSection.module.css";

export default function RecentWorksSection({ works }) {
  return (
    <section id="works" className={styles.section}>
      <SectionTitle>최근의 웹 작업</SectionTitle>

      <div className={styles.grid}>
        {works.map((work) => (
          <WorkPaper key={work.title} work={work} />
        ))}
      </div>
    </section>
  );
}

