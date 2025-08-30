import React from "react";
import styles from "./ComicSticker.module.css";

interface ComicStickerProps {
  text: string;
  color?: string;
  rotation?: number;
}

const ComicSticker: React.FC<ComicStickerProps> = ({
  text,
  color = "#ffcc66",
  rotation = -5,
}) => {
  return (
    <div
      className={styles.sticker}
      style={{ background: color, transform: `rotate(${rotation}deg)` }}
    >
      {text}
    </div>
  );
};

export default ComicSticker;
