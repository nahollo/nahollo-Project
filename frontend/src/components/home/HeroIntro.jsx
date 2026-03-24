import styles from "./HeroIntro.module.css";

export default function HeroIntro() {
  return (
    <section id="home" className={styles.section}>
      <p className={styles.lead}>
        나홀로전세집에 오신 것을 환영합니다. 여기는 웹사이트를 만들고, 기록을
        남기고, 내가 오래 두고 보고 싶은 화면들을 천천히 쌓아가는 개인
        사이트입니다.
      </p>

      <div className={styles.body}>
        <p>
          회사 소개용 랜딩 페이지나 전형적인 포트폴리오보다는, 웹사이트
          개발자인 `nahollo`가 자기 취향과 작업 방식을 그대로 담아둘 수 있는
          조용한 디지털 작업실에 가깝게 만들고 있습니다.
        </p>
        <p>
          이곳의 중심은 웹 작업과 기록입니다. 게임은 정체성의 중심이 아니라,
          사이트 안에 함께 놓인 여러 카테고리 중 하나로 천천히 채워질
          예정입니다.
        </p>
      </div>
    </section>
  );
}

