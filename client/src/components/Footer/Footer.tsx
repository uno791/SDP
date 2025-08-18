import styles from "./Footer.module.css";
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cta}>
        <div className={styles.bump}>Never miss a moment!</div>
        <div className={styles.actions}>
          <button className={styles.primary}>Sign Up Free</button>
          <button className={styles.ghost}>Log In</button>
        </div>
      </div>
      <small>
        © {new Date().getFullYear()} Premier League Live Feed. All rights
        reserved. POW! BAM! FOOTBALL!
      </small>
    </footer>
  );
}
