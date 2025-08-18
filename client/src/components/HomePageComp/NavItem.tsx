import React from "react";
import styles from "../../pages/FootballHomePage.module.css";

type Props = {
  label: string;
  active?: boolean;
};

export default function NavItem({ label, active = false }: Props) {
  return (
    <button
      type="button"
      className={`${styles.navButton} ${active ? styles.homeButton : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </button>
  );
}
