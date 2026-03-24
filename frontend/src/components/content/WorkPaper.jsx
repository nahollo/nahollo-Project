import styles from "./WorkPaper.module.css";

const paletteClasses = {
  clay: styles.paletteClay,
  sage: styles.paletteSage,
  sand: styles.paletteSand,
  mist: styles.paletteMist
};

const layoutClasses = {
  flat: styles.layoutFlat,
  sunk: styles.layoutSunk,
  lifted: styles.layoutLifted,
  offset: styles.layoutOffset
};

export default function WorkPaper({ work }) {
  const wrapperClassName = [styles.wrapper, layoutClasses[work.layout]]
    .filter(Boolean)
    .join(" ");
  const visualClassName = [styles.visual, paletteClasses[work.palette]]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={wrapperClassName}>
      <div className={styles.paper}>
        <span className={styles.tape} />

        <div className={visualClassName}>
          <div className={styles.circle} />
        </div>

        <div className={styles.content}>
          <p className={styles.meta}>
            {work.category} · {work.year}
          </p>
          <h3 className={styles.title}>{work.title}</h3>
          <p className={styles.summary}>{work.summary}</p>
        </div>
      </div>
    </article>
  );
}

