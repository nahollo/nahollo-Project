import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer id="about" className={styles.footer}>
      <p className={styles.heading}>소개</p>
      <p className={styles.text}>
        `nahollo`는 한글 닉네임인 `나홀로전세집`에서 가져온 이름입니다. 이
        사이트는 웹사이트 개발자인 내가 내 방식대로 화면을 만들고, 기록을
        남기고, 카테고리를 천천히 늘려 가는 개인 공간으로 운영하려고 합니다.
      </p>
    </footer>
  );
}

