import styles from "./Header.module.css";
import { useUser } from "../../../Users/UserContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const u = useUser();
  const username = u?.username || "Guest";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Helper component for comic buttons
  const ComicButton = ({ text, to }: { text: string; to: string }) => (
    <button
      className={styles.comicBrutalButton}
      onClick={() => {
        navigate(to);
        setOpen(false); // Close the menu after navigation
      }}
    >
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

      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`${styles.links} ${open ? styles.open : ""}`}>
        <span className={styles.live}>LIVE</span>
        <ComicButton text="Home" to="/" />
        <ComicButton text="Favourite Teams" to="/favourites" />
        <ComicButton text="My Matches" to="/mymatches" />
        <ComicButton text="Profile" to="/profile" />
      </nav>
    </header>
  );
}
