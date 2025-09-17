import React from "react";
import styles from "./Header.module.css";
import { Menu } from "lucide-react";

type HeaderProps = {
  onOpenMenu: () => void;
};

export default function Header({ onOpenMenu }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>FB</div>
          <div className={styles.title}>FootBook</div>
        </div>
        <button
          aria-label="Open menu"
          className={styles.menuButton}
          onClick={onOpenMenu}
        >
          <Menu />
        </button>
      </div>
    </header>
  );
}
