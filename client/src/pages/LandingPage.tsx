import React, { useEffect, useMemo, useState } from "react";
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
import FavouriteLandingMatchesCard from "../components/LandingPageComp/FavouriteLandingMatchesCard";
import NewsCard from "../components/LandingPageComp/NewsCard";
import MarqueeWide from "../components/LandingPageComp/MarqueeWide";
import ThreeFootball from "../components/LandingPageComp/ThreeFootball";
import styles from "../components/LandingPageComp/LandingPage.module.css";
import Loader3D from "../components/LandingPageComp/Layout/Loader3D";
import PremierLeagueTable from "../components/LandingPageComp/PremierLeagueTable";
import type { LeagueId } from "../api/espn";

/* ------------------------------ DATA ------------------------------ */
const LEAGUE_TEAM_MAP: Record<LeagueId, string[]> = {
  eng1: [
    "Arsenal",
    "Aston Villa",
    "AFC Bournemouth",
    "Brentford",
    "Brighton & Hove Albion",
    "Burnley",
    "Chelsea",
    "Crystal Palace",
    "Everton",
    "Fulham",
    "Leeds United",
    "Liverpool",
    "Manchester City",
    "Manchester United",
    "Newcastle United",
    "Nottingham Forest",
    "Sunderland",
    "Tottenham Hotspur",
    "West Ham United",
    "Wolverhampton Wanderers",
  ],
  esp1: [
    "Alavés",
    "Athletic Club",
    "Atlético de Madrid",
    "Barcelona",
    "Real Betis",
    "Celta Vigo",
    "Elche",
    "Espanyol",
    "Getafe",
    "Girona",
    "Levante",
    "Mallorca",
    "Osasuna",
    "Oviedo",
    "Rayo Vallecano",
    "Real Madrid",
    "Real Sociedad",
    "Sevilla",
    "Valencia",
    "Villarreal",
  ],
  ita1: [
    "Atalanta",
    "Bologna",
    "Cagliari",
    "Como",
    "Cremonese",
    "Fiorentina",
    "Genoa",
    "Inter",
    "Juventus",
    "Lazio",
    "Lecce",
    "AC Milan",
    "Napoli",
    "Parma",
    "Pisa",
    "Roma",
    "Sassuolo",
    "Torino",
    "Udinese",
    "Hellas Verona",
  ],
  ger1: [
    "Augsburg",
    "Bayer Leverkusen",
    "Bayern Munich",
    "Borussia Dortmund",
    "Borussia Mönchengladbach",
    "Eintracht Frankfurt",
    "Freiburg",
    "Hamburger SV",
    "Heidenheim",
    "Hoffenheim",
    "1. FC Köln",
    "RB Leipzig",
    "Mainz 05",
    "FC St. Pauli",
    "Stuttgart",
    "Union Berlin",
    "Werder Bremen",
    "Wolfsburg",
  ],
  fra1: [
    "Angers",
    "Auxerre",
    "Brest",
    "Le Havre",
    "Lens",
    "Lille",
    "Lorient",
    "Lyon",
    "Marseille",
    "Metz",
    "Monaco",
    "Nantes",
    "Nice",
    "Paris FC",
    "Paris Saint-Germain",
    "Rennes",
    "Strasbourg",
    "Toulouse",
  ],
  ucl: [
    "Arsenal",
    "Aston Villa",
    "Atalanta",
    "Atlético de Madrid",
    "Barcelona",
    "Bayer Leverkusen",
    "Bayern Munich",
    "Benfica",
    "Borussia Dortmund",
    "Celtic",
    "Chelsea",
    "Feyenoord",
    "Inter",
    "Juventus",
    "Liverpool",
    "Manchester City",
    "Milan",
    "Monaco",
    "Napoli",
    "Paris Saint-Germain",
    "Porto",
    "PSV Eindhoven",
    "RB Leipzig",
    "Real Madrid",
    "Real Sociedad",
    "Roma",
    "Sporting CP",
    "Stuttgart",
    "Tottenham Hotspur",
    "Union Berlin",
    "Valencia",
    "Villarreal",
    "Young Boys",
    "Zenit",
    "Shakhtar Donetsk",
    "Red Star Belgrade",
  ],
  uel: [
    "Ajax",
    "Atalanta",
    "Bayer Leverkusen",
    "Benfica",
    "Brighton",
    "Chelsea",
    "Club Brugge",
    "Eintracht Frankfurt",
    "Feyenoord",
    "Fiorentina",
    "Lazio",
    "Lille",
    "Liverpool",
    "Marseille",
    "PSV Eindhoven",
    "Real Betis",
    "Real Sociedad",
    "Roma",
    "Sevilla",
    "Sporting CP",
    "Tottenham Hotspur",
    "Villarreal",
    "West Ham United",
    "Wolves",
  ],
  uecl: [
    "AZ Alkmaar",
    "Basel",
    "Besiktas",
    "Bodo/Glimt",
    "Club Brugge",
    "Dinamo Zagreb",
    "Fenerbahçe",
    "Gent",
    "Hearts",
    "Lille",
    "Nice",
    "Panathinaikos",
    "Partizan",
    "Rapid Wien",
    "Rangers",
    "Slavia Prague",
    "Sparta Prague",
    "Torino",
    "Trabzonspor",
    "Union SG",
  ],
};

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

/*
  --- Abbreviation logic (EPL map + aliases + fallback) ---
*/

export const TEAM_ABBR_CANON: Record<string, string> = {
  // --- Premier League (eng1) ---
  "AFC Bournemouth": "BOU",
  Arsenal: "ARS",
  "Aston Villa": "AVL",
  Brentford: "BRE",
  "Brighton & Hove Albion": "BHA",
  Burnley: "BUR",
  Chelsea: "CHE",
  "Crystal Palace": "CRY",
  Everton: "EVE",
  Fulham: "FUL",
  "Leeds United": "LEE",
  Liverpool: "LIV",
  "Manchester City": "MCI",
  "Manchester United": "MUN",
  "Newcastle United": "NEW",
  "Nottingham Forest": "NFO",
  Sunderland: "SUN",
  "Tottenham Hotspur": "TOT",
  "West Ham United": "WHU",
  "Wolverhampton Wanderers": "WOL",

  // --- LaLiga (esp1) ---
  Alavés: "ALA",
  "Athletic Club": "ATH", // (aka Athletic Bilbao)
  "Atlético de Madrid": "ATM",
  Barcelona: "FCB",
  "Real Betis": "BET",
  "Celta Vigo": "CEL",
  Elche: "ELC",
  Espanyol: "ESP",
  Getafe: "GET",
  Girona: "GIR",
  Levante: "LEV",
  Mallorca: "MLL",
  Osasuna: "OSA",
  Oviedo: "OVI",
  "Rayo Vallecano": "RAY",
  "Real Madrid": "RMA",
  "Real Sociedad": "RSO",
  Sevilla: "SEV",
  Valencia: "VAL",
  Villarreal: "VIL",

  // --- Serie A (ita1) ---
  Atalanta: "ATA",
  Bologna: "BOL",
  Cagliari: "CAG",
  Como: "COM",
  Cremonese: "CRE",
  Fiorentina: "FIO",
  Genoa: "GEN",
  Inter: "INT",
  Juventus: "JUV",
  Lazio: "LAZ",
  Lecce: "LEC",
  "AC Milan": "MIL",
  Napoli: "NAP",
  Parma: "PAR",
  Pisa: "PIS",
  Roma: "ROM",
  Sassuolo: "SAS",
  Torino: "TOR",
  Udinese: "UDI",
  "Hellas Verona": "VER",

  // --- Bundesliga (ger1) ---
  Augsburg: "AUG",
  "Bayer Leverkusen": "LEV",
  "Bayern Munich": "BAY",
  "Borussia Dortmund": "BVB",
  "Borussia Mönchengladbach": "BMG",
  "Eintracht Frankfurt": "SGE",
  Freiburg: "SCF",
  "Hamburger SV": "HSV",
  Heidenheim: "HEI",
  Hoffenheim: "TSG",
  "1. FC Köln": "KOE",
  "RB Leipzig": "RBL",
  "Mainz 05": "MAI",
  "FC St. Pauli": "STP",
  Stuttgart: "VFB",
  "Union Berlin": "FCU",
  "Werder Bremen": "BRE",
  Wolfsburg: "WOB",

  // --- Ligue 1 (fra1) ---
  Angers: "ANG",
  Auxerre: "AUX",
  Brest: "BRE",
  "Le Havre": "HAC",
  Lens: "RCL",
  Lille: "LIL",
  Lorient: "LOR",
  Lyon: "LYO",
  Marseille: "MAR",
  Metz: "MET",
  Monaco: "ASM",
  Nantes: "NAN",
  Nice: "NIC",
  "Paris FC": "PFC",
  "Paris Saint-Germain": "PSG",
  Rennes: "REN",
  Strasbourg: "STR",
  Toulouse: "TFC",
};

// Common variants/short names → canonical names
export const TEAM_ALIASES: Record<string, string[]> = {
  // --- Premier League ---
  "AFC Bournemouth": ["Bournemouth"],
  "Aston Villa": ["Villa"],
  "Brighton & Hove Albion": [
    "Brighton",
    "Brighton Hove Albion",
    "Brighton & Hove",
    "BHAFC",
  ],
  "Crystal Palace": ["Palace"],
  "Leeds United": ["Leeds"],
  Liverpool: ["LFC"],
  "Manchester City": ["Man City", "Man. City", "MCFC", "Manchester C"],
  "Manchester United": ["Man United", "Man Utd", "Man. United", "MUFC"],
  "Newcastle United": ["Newcastle", "NUFC"],
  "Nottingham Forest": ["Nottingham", "Nottm Forest", "Forest"],
  "Tottenham Hotspur": ["Tottenham", "Spurs"],
  "West Ham United": ["West Ham"],
  "Wolverhampton Wanderers": ["Wolverhampton", "Wolves"],
  Arsenal: ["AFC", "Arsenal FC"],

  // --- LaLiga ---
  "Athletic Club": ["Athletic Bilbao", "Bilbao"],
  "Atlético de Madrid": [
    "Atletico Madrid",
    "Atletico de Madrid",
    "Atlético Madrid",
    "Atleti",
  ],
  Barcelona: ["FC Barcelona", "Barca", "Barça"],
  "Celta Vigo": ["RC Celta", "Celta de Vigo"],
  Espanyol: ["RCD Espanyol"],
  Girona: ["Girona FC"],
  "Real Betis": ["Real Betis Balompié", "Betis"],
  "Real Madrid": ["Real Madrid CF", "RM"],
  "Real Sociedad": ["Real Sociedad de Fútbol", "La Real"],
  Sevilla: ["Sevilla FC"],
  Villarreal: ["Villarreal CF"],
  Alavés: ["Deportivo Alavés"],
  "Rayo Vallecano": ["Rayo"],
  Osasuna: ["CA Osasuna"],

  // --- Serie A ---
  "AC Milan": ["Milan", "ACM"],
  Inter: ["Inter Milan", "Internazionale", "FC Internazionale"],
  Juventus: ["Juve"],
  Lazio: ["SS Lazio"],
  Roma: ["AS Roma"],
  Fiorentina: ["ACF Fiorentina"],
  "Hellas Verona": ["Verona"],
  Udinese: ["Udinese Calcio"],
  Sassuolo: ["US Sassuolo"],
  Torino: ["Torino FC"],
  Cremonese: ["US Cremonese"],
  Como: ["Como 1907"],

  // --- Bundesliga ---
  "Bayern Munich": ["FC Bayern", "Bayern", "FCB"],
  "Bayer Leverkusen": ["Leverkusen", "Bayer 04"],
  "Borussia Dortmund": ["Dortmund"],
  "Borussia Mönchengladbach": [
    "Mönchengladbach",
    "Monchengladbach",
    "Gladbach",
  ],
  "Eintracht Frankfurt": ["Eintracht", "Frankfurt"],
  Freiburg: ["SC Freiburg"],
  Hoffenheim: ["TSG Hoffenheim"],
  "1. FC Köln": ["FC Köln", "FC Koln", "Koln", "Köln"],
  "RB Leipzig": ["Leipzig"],
  "Mainz 05": ["Mainz"],
  Stuttgart: ["VfB Stuttgart"],
  "Union Berlin": ["1. FC Union Berlin", "Union"],
  "Werder Bremen": ["Bremen"],
  Wolfsburg: ["VfL Wolfsburg"],
  "Hamburger SV": ["Hamburg", "HSV"],
  "FC St. Pauli": ["St. Pauli"],

  // --- Ligue 1 ---
  "Paris Saint-Germain": ["PSG"],
  Marseille: ["Olympique de Marseille", "OM"],
  Lyon: ["Olympique Lyonnais", "OL"],
  Lille: ["LOSC Lille", "LOSC"],
  Lens: ["RC Lens"],
  "Le Havre": ["Le Havre AC"],
  Nice: ["OGC Nice"],
  Nantes: ["FC Nantes"],
  Rennes: ["Stade Rennais", "SRFC"],
  Strasbourg: ["RC Strasbourg", "RCSA"],
  Toulouse: ["Toulouse FC", "TFC"],
  Monaco: ["AS Monaco", "ASM"],
  Angers: ["SCO Angers"],
  Auxerre: ["AJ Auxerre"],
  Metz: ["FC Metz"],
  Lorient: ["FC Lorient"],
  "Paris FC": ["PFC"],
};

// Normalizer
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

// Build lookup (canon + aliases)
export const ABBR_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canon, code] of Object.entries(TEAM_ABBR_CANON)) {
    map[normalize(canon)] = code;
    for (const alias of TEAM_ALIASES[canon] ?? []) {
      map[normalize(alias)] = code;
    }
  }
  return map;
})();

// Smarter fallback: prefer 3 letters from the first word if initials < 3
export const fallbackAbbrev = (name: string) => {
  const words = name
    .replace(/&/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length >= 2) {
    const initials = words
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    if (initials.length >= 3) return initials.slice(0, 3);
    const first = words[0] ?? "";
    if (first.length >= 3) return first.slice(0, 3).toUpperCase();
    return (initials + first.slice(0, 3 - initials.length).toUpperCase()).slice(
      0,
      3
    );
  }
  return (words[0] ?? name).slice(0, 3).toUpperCase();
};

// Public helper
export const abbreviateTeam = (name: string) => {
  const key = normalize(name);
  return ABBR_LOOKUP[key] ?? fallbackAbbrev(name);
};
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

  const marqueeWords = useMemo(
    () =>
      (LEAGUE_TEAM_MAP[league] ?? LEAGUE_TEAM_MAP.eng1).map((team) =>
        abbreviateTeam(team)
      ),
    [league]
  );

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
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
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

      {/* Google Fonts imports (duplicated previously; one block is enough) */}
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
          <h1 className={styles.heroTitle}>
            FOOT<span className={styles.heroBreak}></span>BOOK
          </h1>

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
                <label
                  htmlFor="landing-league-select"
                  style={{ fontWeight: 600 }}
                >
                  League
                </label>
                <select
                  id="landing-league-select"
                  value={league}
                  onChange={handleLeagueChange}
                  aria-label="Select league"
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    color: "#000",
                  }}
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
                <Link to="/what-is-footbook" className={styles.secondaryBtn}>
                  What is Footbook?
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
          <MarqueeWide words={marqueeWords} />
        </section>

        {/* FAVOURITE TEAM MATCHES */}
        <section className={styles.sectionGray}>
          <div className={styles.stack}>
            <FavouriteLandingMatchesCard league={league} />
          </div>
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
          <PremierLeagueTable league={league} />
        </section>

        {/* NEWS */}
        <section id="news" className={styles.sectionGray}>
          <h3 className={styles.sectionHeading}>Latest News</h3>
          <NewsCard league={league} />
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
