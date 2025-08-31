import React from "react";
import styles from "./ComicCard.module.css";

interface ComicCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ComicCard: React.FC<ComicCardProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={`${styles.cardWrapper} ${className || ""}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.card}>{children}</div>
    </div>
  );
};

export default ComicCard;
