import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import styles from "../components/LandingPageComp/LandingPage.module.css";
import Loader3D from "../components/LandingPageComp/Layout/Loader3D";
import PremierLeagueTable from "../components/LandingPageComp/PremierLeagueTable";
/* ------------------------------ DATA ------------------------------ */
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

/* ------------------------------ PAGE ------------------------------ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fonts
  const FontImports = () => (
    <style>
      {`@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap');`}
    </style>
  );

  // Small parallax on the 3D ball
  const { scrollY } = useScroll();
  // gentle parallax up for the ball (keep small so it stays in the hero)
  const yFootball = useTransform(scrollY, [0, 600], [200, -120]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      <FontImports />

      {/* Google Fonts imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Alumni+Sans+Pinstripe:ital@0;1&display=swap');
      `}</style>

      {/* Loader */}

      <AnimatePresence>{loading && <Loader3D />}</AnimatePresence>

      {/* Header & Menu */}

      <Header onOpenMenu={() => setMenuOpen(true)} />
      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>FOOTBOOK</h1>

          <div className={styles.heroContent}>
            {/* Bottom-left tagline & buttons */}

            <div className={styles.heroOverlay}>
              <h2 className={styles.heroHeading}>
                LIVE PREMIER LEAGUE ACTION — IN YOUR HANDS
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
                <Link to="/signup" className={styles.secondaryBtn}>
                  Sign Up / Log In
                </Link>
              </div>
            </div>

            {/* Ball (flex sibling; moved left & down via CSS; parallax via yFootball) */}
            <motion.div style={{ y: yFootball }} className={styles.heroBall}>
              <ThreeFootball />
            </motion.div>
          </div>
        </section>

        {/* TEAM TICKER */}
        <section className={styles.ticker}>
          <MarqueeWide
            words={TEAM_NAMES.map((t) => t.slice(0, 3).toUpperCase())}
          />
        </section>

        {/* LIVE MATCHES — RENDER EXACTLY ONE GRID */}
        <section id="live" className={styles.sectionWhite}>
          <h3 className={styles.sectionHeading}>Live Matches</h3>
          {/* LiveMatchCard already fetches and renders a full grid with fallback & dedupe */}
          <LiveMatchCard />
        </section>

        {/* PAST MATCHES (your static examples) */}
        <section id="past" className={styles.sectionGray}>
          <div className={styles.stack}>
            <PastMatchCard />
          </div>
        </section>

        {/* LEAGUE TABLE */}
        <section id="table" className={styles.sectionWhite}>
          <h3 className={styles.sectionHeading}>League Table</h3>
          <PremierLeagueTable />
        </section>

        {/* NEWS */}
        <section id="news" className={styles.sectionGray}>
          <h3 className={styles.sectionHeading}>Latest News</h3>
          <NewsCard />
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
