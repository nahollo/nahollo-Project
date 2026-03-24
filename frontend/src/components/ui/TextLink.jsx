import styles from "./TextLink.module.css";

export default function TextLink({ href, children }) {
  return (
    <a className={styles.link} href={href}>
      {children}
    </a>
  );
}

