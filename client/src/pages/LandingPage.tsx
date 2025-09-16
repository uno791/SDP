import React, { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";

import Header from "../components/LandingPageComp/Layout/Header";
import BurgerMenu from "../components/LandingPageComp/Layout/BurgerMenu";
import LeagueTable from "../components/LandingPageComp/LeagueTable";
import LiveMatchCard from "../components/LandingPageComp/LiveMatchCard";
import PastMatchCard from "../components/LandingPageComp/PastMatchCard";
import NewsCard from "../components/LandingPageComp/NewsCard";
import MarqueeWide from "../components/LandingPageComp/MarqueeWide";
import ThreeFootball from "../components/LandingPageComp/ThreeFootball";
// import "@fontsource-variable/bricolage-grotesque";
// import "@fontsource/inter";
import styles from "../components/LandingPageComp/LandingPage.module.css";

// ─────────────────────────────── FIXTURE DATA ───────────────────────────────
const TEAM_NAMES = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton",
  "Burnley",
  "Chelsea",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Liverpool",
  "Luton",
  "Manchester City",
  "Manchester United",
  "Newcastle",
  "Nottingham Forest",
  "Sheffield United",
  "Tottenham",
  "West Ham",
  "Wolves",
];

const fixtures = [
  {
    date: "Sat 21 Sep",
    home: "Arsenal",
    away: "Chelsea",
    time: "14:30",
    scoreA: 2,
    scoreB: 1,
    minute: 67,
  },
  {
    date: "Sat 21 Sep",
    home: "Man City",
    away: "Spurs",
    time: "17:00",
    scoreA: 2,
    scoreB: 1,
    minute: 89,
  },
  {
    date: "Sun 22 Sep",
    home: "Liverpool",
    away: "Newcastle",
    time: "16:00",
    scoreA: 0,
    scoreB: 0,
    minute: 12,
  },
];

const pastMatches = [
  {
    date: "Sun 15 Sep",
    home: "Everton",
    away: "Brentford",
    scoreA: 1,
    scoreB: 1,
  },
  {
    date: "Sat 14 Sep",
    home: "Tottenham",
    away: "Arsenal",
    scoreA: 2,
    scoreB: 3,
  },
];

const leagueTable = [
  {
    pos: 1,
    team: "Man City",
    played: 5,
    won: 4,
    drawn: 1,
    lost: 0,
    gd: "+10",
    pts: 13,
  },
  {
    pos: 2,
    team: "Arsenal",
    played: 5,
    won: 4,
    drawn: 0,
    lost: 1,
    gd: "+8",
    pts: 12,
  },
  {
    pos: 3,
    team: "Liverpool",
    played: 5,
    won: 3,
    drawn: 2,
    lost: 0,
    gd: "+6",
    pts: 11,
  },
];

const newsItems = [
  {
    title: "Transfer Window Buzz",
    summary: "Rumours swirl as clubs eye January reinforcements.",
  },
  {
    title: "Injury Update",
    summary: "Key players ruled out for the next few weeks.",
  },
  {
    title: "Manager of the Month",
    summary: "Recognition for outstanding performance in September.",
  },
];

// ─────────────────────────────── MAIN PAGE ───────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const yFootball = useTransform(scrollY, [0, 600], [0, 100]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* Loader */}

      <AnimatePresence>
        {loading && (
          <motion.div
            className={styles.loader}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            FootBook — loading live data…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Menu */}
      <Header onOpenMenu={() => setMenuOpen(true)} />
      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          {/* Big FOOTBOOK heading */}
          <style>
            @import
            url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Badeen+Display&display=swap');
          </style>
          <h1 className={styles.heroTitle}>FOOTBOOK</h1>
          {/* Ball centered */}
          <motion.div style={{ y: yFootball }}>
            <ThreeFootball />
          </motion.div>
          <div className={styles.heroContent}>
            {/* Bottom-left tagline & buttons */}
            <style>
              @import
              url('https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap');
            </style>
            <div className={styles.heroOverlay}>
              <h2 className={styles.heroHeading}>
                LIVE PREMIER LEAGUE ACTION - IN YOUR HANDS
              </h2>
              <p className={styles.heroSub}>
                REAL-TIME SCORES, FIXTURES, TABLES, AND NEWS
              </p>
              <div className={styles.heroButtons}>
                <a href="#live" className={styles.primaryBtn}>
                  View Live Matches
                </a>
                <a href="#news" className={styles.secondaryBtn}>
                  Latest News
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM TICKER */}
        <section className={styles.ticker}>
          <MarqueeWide
            words={TEAM_NAMES.map((t) => t.slice(0, 3).toUpperCase())}
          />
        </section>

        {/* LIVE MATCHES */}
        <section id="live" className={styles.sectionWhite}>
          <h3 className={styles.sectionHeading}>Live Matches</h3>
          <div className={styles.grid3}>
            {fixtures.map((f, i) => (
              <LiveMatchCard key={i} {...f} />
            ))}
          </div>
        </section>

        {/* PAST MATCHES */}
        <section id="past" className={styles.sectionGray}>
          <h3 className={styles.sectionHeading}>Past Matches</h3>
          <div className={styles.stack}>
            {pastMatches.map((m, i) => (
              <PastMatchCard key={i} {...m} />
            ))}
          </div>
        </section>

        {/* LEAGUE TABLE */}
        <section id="table" className={styles.sectionWhite}>
          <h3 className={styles.sectionHeading}>League Table</h3>
          <LeagueTable data={leagueTable} />
        </section>

        {/* NEWS */}
        <section id="news" className={styles.sectionGray}>
          <h3 className={styles.sectionHeading}>Latest News</h3>
          <div className={styles.grid3}>
            {newsItems.map((n, i) => (
              <NewsCard key={i} {...n} />
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              FootBook © {new Date().getFullYear()}
            </div>
            <div className={styles.footerNote}>
              Built for fans. Connect APIs for live data.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
