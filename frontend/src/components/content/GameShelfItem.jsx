import TextLink from "../ui/TextLink.jsx";
import styles from "./GameShelfItem.module.css";

const paletteClasses = {
  olive: styles.paletteOlive,
  brown: styles.paletteBrown
};

export default function GameShelfItem({ game }) {
  const thumbnailClassName = [styles.thumbnail, paletteClasses[game.palette]]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={styles.item}>
      <div className={styles.frame}>
        <div className={thumbnailClassName}>
          <div className={styles.bar} />
          <div className={styles.dot} />
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.summary}>{game.summary}</p>
        <TextLink href="#games">카테고리 보기 →</TextLink>
      </div>
    </article>
  );
}

