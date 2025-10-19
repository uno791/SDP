import React, { useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";
import BurgerMenu from "../LandingPageComp/Layout/BurgerMenu";
import styles from "./MatchNavBar.module.css";

export default function MatchNavBar() {
  const [sp] = useSearchParams();
  const eventId = sp.get("id");
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!eventId) return null; // don’t show if no match id

  const mobileNavListClassName = [
    styles.navListMobile,
    navOpen ? styles.navListMobileOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const closeNav = () => setNavOpen(false);

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
              onClick={closeNav}
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
              onClick={closeNav}
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
              onClick={closeNav}
            >
              Commentary
            </NavLink>
          </li>
        </ul>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.navToggle}
            onClick={() => setNavOpen((prev) => !prev)}
            aria-label="Toggle match navigation"
            aria-expanded={navOpen}
            aria-controls="match-nav-mobile"
          >
            {navOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open site navigation"
          >
            <Menu />
          </button>
        </div>
      </nav>

      <ul id="match-nav-mobile" className={mobileNavListClassName}>
        <li>
          <NavLink
            to={`/matchviewer?id=${eventId}`}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
            onClick={closeNav}
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
            onClick={closeNav}
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
            onClick={closeNav}
          >
            Commentary
          </NavLink>
        </li>
      </ul>

      <BurgerMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
