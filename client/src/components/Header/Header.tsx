import styles from "./Header.module.css";
import { useUser } from "../../Users/UserContext";
import { Link } from "react-router-dom";

export default function Header() {
  const u = useUser();
  const username = u?.username || "Guest"; // fallback if username is undefined

  return (
    <header className={styles.nav}>
      <div className={styles.brand}>Foot Book</div>
      <nav className={styles.links}>
        <span className={styles.live}>LIVE</span>
        <Link to="/">Home</Link>
        <span>News</span>
        <span>Favourite Teams</span>
        <Link to="/doodlehome">doodleHome</Link>
        <span className={styles.username}>{username}</span>
      </nav>
    </header>
  );
}
