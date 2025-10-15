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
import type { LeagueId } from "../api/espn";
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

const LEAGUE_STORAGE_KEY = "league";
const DEFAULT_LEAGUE: LeagueId = "eng1";
const LEAGUE_OPTIONS: Array<{ id: LeagueId; label: string }> = [
  { id: "eng1", label: "Premier League" },
  { id: "esp1", label: "LaLiga" },
  { id: "ita1", label: "Serie A" },
  { id: "ger1", label: "Bundesliga" },
  { id: "fra1", label: "Ligue 1" },
  { id: "ucl", label: "UEFA Champions League" },
  { id: "uel", label: "UEFA Europa League" },
  { id: "uecl", label: "UEFA Europa Conference League" },
];

const isLeagueId = (value: string | null): value is LeagueId =>
  value != null && LEAGUE_OPTIONS.some((option) => option.id === value);

/* ------------------------------ PAGE ------------------------------ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<LeagueId>(() => {
    if (typeof window === "undefined") return DEFAULT_LEAGUE;
    try {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("league");
      if (isLeagueId(query)) {
        localStorage.setItem(LEAGUE_STORAGE_KEY, query);
        return query;
      }
      const stored = localStorage.getItem(LEAGUE_STORAGE_KEY);
      if (isLeagueId(stored)) return stored;
    } catch {
      /* ignore */
    }
    return DEFAULT_LEAGUE;
  });

  const handleLeagueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as LeagueId;
    setLeague(next);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LEAGUE_STORAGE_KEY, league);
    } catch {
      /* ignore storage errors */
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("league", league);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* ignore history errors */
    }
  }, [league]);

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
                LIVE FOOTBALL ACTION - IN YOUR HANDS
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0.75rem 0",
                }}
              >
                <label htmlFor="landing-league-select" style={{ fontWeight: 600 }}>
                  League
                </label>
                <select
                  id="landing-league-select"
                  value={league}
                  onChange={handleLeagueChange}
                  aria-label="Select league"
                  style={{ padding: "0.25rem 0.5rem", borderRadius: "4px" }}
                >
                  {LEAGUE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
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
          <LiveMatchCard league={league} />
        </section>

        {/* PAST MATCHES (your static examples) */}
        <section id="past" className={styles.sectionGray}>
          <div className={styles.stack}>
            <PastMatchCard league={league} />
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
