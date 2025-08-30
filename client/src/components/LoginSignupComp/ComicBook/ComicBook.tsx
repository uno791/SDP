import React from "react";
import styles from "./ComicBook.module.css";
import ComicPanel from "../ComicPanel/ComicPanel";
import AuthPanel from "../Auth/AuthPanel";
import playerKick from "../../../assets/player-kick.png";
import goalkeeper from "../../../assets/goalkeeper.png";
import ComicSticker from "../ComicStickers/ComicStickers";

const ComicBook: React.FC = () => {
  return (
    <div className={styles.bookWrapper}>
      <div className={styles.page}>
        {/* Left page */}
        <ComicPanel color="#ffb84d">
          <AuthPanel type="signup" image={playerKick} side="left" />
        </ComicPanel>

        {/* Right page */}
        <ComicPanel color="#f5ebd7">
          <AuthPanel type="login" image={goalkeeper} side="right" />
        </ComicPanel>

        {/* Spine dots */}
        <div className={styles.spine}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={styles.dot}></span>
          ))}
        </div>

        {/* Bottom strip */}
        <div className={styles.footerStrip}>FOOT BOOK COMICS</div>

        {/* Stickers for flare */}
        <div className={`${styles.stickerWrapper} ${styles.page1}`}>
          <ComicSticker text="Page 1" rotation={-4} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.page2}`}>
          <ComicSticker text="Page 2" rotation={6} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.live}`}>
          <ComicSticker text="LIVE!" color="#ffdd55" rotation={-6} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.boom}`}>
          <ComicSticker text="BOOM!" rotation={8} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.quoteLeft}`}>
          <ComicSticker
            text='"The ultimate football tracking experience awaits you!"'
            color="#fff"
            rotation={-2}
          />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.followTeams}`}>
          <ComicSticker text="follow your favourite teams" rotation={-10} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.kickOff}`}>
          <ComicSticker text="KICK OFF!" rotation={2} />
        </div>

        <div className={`${styles.stickerWrapper} ${styles.adventure}`}>
          <ComicSticker
            text='"Enter the ultimate football adventure!"'
            color="#003366"
            rotation={-5}
          />
        </div>
      </div>
    </div>
  );
};

export default ComicBook;
