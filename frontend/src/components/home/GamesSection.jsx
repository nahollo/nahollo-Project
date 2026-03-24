import SectionTitle from "../content/SectionTitle.jsx";
import GameShelfItem from "../content/GameShelfItem.jsx";
import styles from "./GamesSection.module.css";

export default function GamesSection({ games }) {
  return (
    <section id="games" className={styles.section}>
      <SectionTitle>게임 카테고리</SectionTitle>

      <div className={styles.intro}>
        <p>
          이 사이트는 게임 개발자 사이트가 아닙니다. 다만 개인 사이트 안에 내가
          흥미를 느끼는 카테고리 하나쯤은 자연스럽게 두고 싶어서, 게임도
          별도의 자리로 남겨두고 있습니다.
        </p>
      </div>

      <div className={styles.list}>
        {games.map((game) => (
          <GameShelfItem key={game.title} game={game} />
        ))}
      </div>
    </section>
  );
}

