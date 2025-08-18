import styles from "./Header.module.css";
import { useUser } from "../../Users/UserContext";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const u = useUser();
  const username = u?.username || "Guest";
  const navigate = useNavigate();

  // Helper component for comic buttons
  const ComicButton = ({ text, to }: { text: string; to: string }) => (
    <button className={styles.comicBrutalButton} onClick={() => navigate(to)}>
      <div className={styles.buttonInner}>
        <span className={styles.buttonText}>{text}</span>
        <div className={styles.halftoneOverlay}></div>
        <div className={styles.inkSplatter}></div>
      </div>
      <div className={styles.buttonShadow}></div>
      <div className={styles.buttonFrame}></div>
    </button>
  );

  return (
    <header className={styles.nav}>
      <div className={styles.brand}>
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F9cae8401b37e4b32b0c47072abf66007%2F30f43436757e4098bb3dce9cb405c5a7?format=webp&width=800"
          alt="FootBook Logo"
          className={styles.logo}
        />
      </div>
      <nav className={styles.links}>
        <span className={styles.live}>LIVE</span>
        <ComicButton text="Home" to="/" />
        <ComicButton text="Favourite Teams" to="/favourites" />
        <ComicButton text="doodleHome" to="/doodlehome" />
        <span className={styles.username}>{username}</span>
      </nav>
    </header>
  );
}
