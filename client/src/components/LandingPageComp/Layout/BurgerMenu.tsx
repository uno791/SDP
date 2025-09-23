import React from "react";
import styles from "./BurgerMenu.module.css";
import { X } from "lucide-react";

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "home", label: "Old Home" },
  { id: "", label: "Home" },
  { id: "favourite", label: "Favourite Teams" },
  { id: "user-games", label: "User Games" },
  { id: "profile", label: "Profile" },
  { id: "mymatches", label: "User Matches" },
];

type BurgerMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function BurgerMenu({ open, onClose }: BurgerMenuProps) {
  return (
    <aside className={`${styles.menu} ${open ? styles.open : ""}`}>
      <div className={styles.top}>
        <div className={styles.title}>Menu</div>
        <button onClick={onClose} className={styles.closeButton}>
          <X />
        </button>
      </div>
      <nav className={styles.nav}>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`/${s.id}`}
            onClick={onClose}
            className={styles.link}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
