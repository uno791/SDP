import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.nav}>
      <div className={styles.brand}>Foot Book</div>
      <nav className={styles.links}>
        <a className={styles.live}>LIVE</a>
        <a>Home</a>
        <a>News</a>
        <a>Favourite Teams</a>
        <a>Profile</a>
      </nav>
    </header>
  );
}
