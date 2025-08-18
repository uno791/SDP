import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cta}>
        <div className={styles.bump}>Never miss a moment!</div>
        <div className={styles.actions}>
          <Link to="/signuppage">
            <button className={styles.primary}>Sign Up Free</button>
          </Link>
          <Link to="/loginpage">
            <button className={styles.ghost}>Log In</button>
          </Link>
        </div>
      </div>
      <small>
        © {new Date().getFullYear()} Premier League Live Feed. All rights
        reserved. POW! BAM! FOOTBALL!
      </small>
    </footer>
  );
}
