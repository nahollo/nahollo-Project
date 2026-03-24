import styles from "./SectionTitle.module.css";

export default function SectionTitle({ children }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{children}</h2>
    </div>
  );
}

