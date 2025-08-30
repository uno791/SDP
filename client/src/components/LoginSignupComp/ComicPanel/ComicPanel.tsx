import React from "react";
import styles from "./ComicPanel.module.css";

interface ComicPanelProps {
  color: string;
  children?: React.ReactNode;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ color, children }) => {
  return (
    <div className={styles.panelWrapper} style={{ background: color }}>
      <div className={styles.innerPanel}>{children}</div>
    </div>
  );
};

export default ComicPanel;
