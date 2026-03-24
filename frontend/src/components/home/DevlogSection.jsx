import SectionTitle from "../content/SectionTitle.jsx";
import DevlogItem from "../content/DevlogItem.jsx";
import styles from "./DevlogSection.module.css";

export default function DevlogSection({ entries }) {
  return (
    <section id="devlog" className={styles.section}>
      <SectionTitle>최근 기록</SectionTitle>

      <div className={styles.list}>
        {entries.map((entry) => (
          <DevlogItem key={entry.date + entry.title} entry={entry} />
        ))}
      </div>
    </section>
  );
}

