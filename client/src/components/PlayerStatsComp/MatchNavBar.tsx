import React, { useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import BurgerMenu from "../LandingPageComp/Layout/BurgerMenu";
import styles from "./MatchNavBar.module.css";

export default function MatchNavBar() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id");
  const [menuOpen, setMenuOpen] = useState(false);

  if (!eventId) return null; // don’t show if no match id

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.logo}>FB</div>
          <div className={styles.title}>FootBook</div>
        </div>
        <ul className={styles.navList}>
          <li>
            <NavLink
              to={`/matchviewer?id=${eventId}`}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              Match Overview
            </NavLink>
          </li>
          <li>
            <NavLink
              to={`/playerstats?id=${eventId}`}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              Player Stats
            </NavLink>
          </li>
          <li>
            <NavLink
              to={`/commentary?id=${eventId}`}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              Commentary
            </NavLink>
          </li>
        </ul>

        <button
          className={styles.burgerButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </button>
      </nav>

      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
