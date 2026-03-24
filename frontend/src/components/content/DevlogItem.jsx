import styles from "./DevlogItem.module.css";

export default function DevlogItem({ entry }) {
  return (
    <article className={styles.item}>
      <p className={styles.date}>{entry.date}</p>
      <div className={styles.body}>
        <h3 className={styles.title}>{entry.title}</h3>
        <p className={styles.excerpt}>{entry.excerpt}</p>
      </div>
    </article>
  );
}

