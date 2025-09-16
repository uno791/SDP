// import React, { useEffect, useState } from "react";
// import {
//   motion,
//   AnimatePresence,
//   useScroll,
//   useTransform,
// } from "framer-motion";

// import Header from "../components/LandingPageComp/Layout/Header";
// import BurgerMenu from "../components/LandingPageComp/Layout/BurgerMenu";
// import LeagueTable from "../components/LandingPageComp/LeagueTable";
// import LiveMatchCard from "../components/LandingPageComp/LiveMatchCard";
// import PastMatchCard from "../components/LandingPageComp/PastMatchCard";
// import NewsCard from "../components/LandingPageComp/NewsCard";
// import MarqueeWide from "../components/LandingPageComp/MarqueeWide";
// import ThreeFootball from "../components/LandingPageComp/ThreeFootball";

// // ─────────────────────────────── FIXTURE DATA ───────────────────────────────
// const TEAM_NAMES = [
//   "Arsenal",
//   "Aston Villa",
//   "Bournemouth",
//   "Brentford",
//   "Brighton",
//   "Burnley",
//   "Chelsea",
//   "Crystal Palace",
//   "Everton",
//   "Fulham",
//   "Liverpool",
//   "Luton",
//   "Manchester City",
//   "Manchester United",
//   "Newcastle",
//   "Nottingham Forest",
//   "Sheffield United",
//   "Tottenham",
//   "West Ham",
//   "Wolves",
// ];

// const fixtures = [
//   {
//     date: "Sat 21 Sep",
//     home: "Arsenal",
//     away: "Chelsea",
//     time: "14:30",
//     scoreA: 2,
//     scoreB: 1,
//     minute: 67,
//   },
//   {
//     date: "Sat 21 Sep",
//     home: "Man City",
//     away: "Spurs",
//     time: "17:00",
//     scoreA: 2,
//     scoreB: 1,
//     minute: 89,
//   },
//   {
//     date: "Sun 22 Sep",
//     home: "Liverpool",
//     away: "Newcastle",
//     time: "16:00",
//     scoreA: 0,
//     scoreB: 0,
//     minute: 12,
//   },
// ];

// const pastMatches = [
//   {
//     date: "Sun 15 Sep",
//     home: "Everton",
//     away: "Brentford",
//     scoreA: 1,
//     scoreB: 1,
//   },
//   {
//     date: "Sat 14 Sep",
//     home: "Tottenham",
//     away: "Arsenal",
//     scoreA: 2,
//     scoreB: 3,
//   },
// ];

// const leagueTable = [
//   {
//     pos: 1,
//     team: "Man City",
//     played: 5,
//     won: 4,
//     drawn: 1,
//     lost: 0,
//     gd: "+10",
//     pts: 13,
//   },
//   {
//     pos: 2,
//     team: "Arsenal",
//     played: 5,
//     won: 4,
//     drawn: 0,
//     lost: 1,
//     gd: "+8",
//     pts: 12,
//   },
//   {
//     pos: 3,
//     team: "Liverpool",
//     played: 5,
//     won: 3,
//     drawn: 2,
//     lost: 0,
//     gd: "+6",
//     pts: 11,
//   },
// ];

// const newsItems = [
//   {
//     title: "Transfer Window Buzz",
//     summary: "Rumours swirl as clubs eye January reinforcements.",
//   },
//   {
//     title: "Injury Update",
//     summary: "Key players ruled out for the next few weeks.",
//   },
//   {
//     title: "Manager of the Month",
//     summary: "Recognition for outstanding performance in September.",
//   },
// ];

// // ─────────────────────────────── MAIN PAGE ───────────────────────────────
// export default function LandingPage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [loading, setLoading] = useState(true);

//   const { scrollY } = useScroll();
//   const yHero = useTransform(scrollY, [0, 600], [0, -150]);
//   const scaleHero = useTransform(scrollY, [0, 600], [1, 1.2]);
//   const yFootball = useTransform(scrollY, [0, 600], [0, 100]);

//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 1400);
//     return () => clearTimeout(t);
//   }, []);

//   return (
//     <div className="min-h-screen font-sans bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-600">
//       {/* ─────────────── LOADER ─────────────── */}
//       <AnimatePresence>
//         {loading && (
//           <motion.div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/80 text-white text-xl font-semibold"
//             initial={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             FootBook — loading live data…
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ─────────────── HEADER & MENU ─────────────── */}
//       <Header onOpenMenu={() => setMenuOpen(true)} />
//       <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

//       <main className="pt-24">
//         {/* ─────────────── HERO ─────────────── */}
//         <section className="relative min-h-[85vh] flex items-center justify-center px-6 md:px-12 overflow-hidden">
//           <motion.h1
//             style={{ y: yHero, scale: scaleHero }}
//             className="absolute inset-0 flex items-center justify-center text-[18vw] md:text-[14vw] lg:text-[12vw] font-extrabold text-white/90 pointer-events-none select-none"
//           >
//             FOOTBOOK
//           </motion.h1>

//           <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:justify-between max-w-6xl w-full">
//             <div className="text-white w-full lg:w-1/2">
//               <h2 className="text-4xl md:text-5xl font-bold mb-4">
//                 Live Premier League action — in your hands
//               </h2>
//               <p className="text-lg md:text-xl text-white/90 mb-6">
//                 Real-time scores, fixtures, tables, and news — designed for fans
//                 who can’t miss a second.
//               </p>
//               <div className="flex gap-3">
//                 <a
//                   href="#live"
//                   className="px-5 py-3 bg-white text-emerald-700 rounded-lg font-bold shadow hover:scale-[1.02] transition-transform"
//                 >
//                   View Live Matches
//                 </a>
//                 <a
//                   href="#news"
//                   className="px-5 py-3 border border-white/20 rounded-lg text-white/90 hover:bg-white/5"
//                 >
//                   Latest News
//                 </a>
//               </div>
//             </div>
//             <div className="w-full lg:w-1/2 flex justify-center">
//               <div className="relative w-72 h-72 lg:w-96 lg:h-96">
//                 <ThreeFootball />
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ─────────────── TEAM TICKER ─────────────── */}
//         <section className="bg-emerald-900 text-white py-6">
//           <MarqueeWide
//             words={TEAM_NAMES.map((t) => t.slice(0, 3).toUpperCase())}
//           />
//         </section>

//         {/* ─────────────── LIVE MATCHES ─────────────── */}
//         <section id="live" className="px-6 md:px-12 py-16 bg-white">
//           <h3 className="text-3xl font-bold mb-6">Live Matches</h3>
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {fixtures.map((f, i) => (
//               <LiveMatchCard key={i} {...f} />
//             ))}
//           </div>
//         </section>

//         {/* ─────────────── PAST MATCHES ─────────────── */}
//         <section id="past" className="px-6 md:px-12 py-16 bg-gray-50">
//           <h3 className="text-3xl font-bold mb-6">Past Matches</h3>
//           <div className="space-y-4">
//             {pastMatches.map((m, i) => (
//               <PastMatchCard key={i} {...m} />
//             ))}
//           </div>
//         </section>

//         {/* ─────────────── LEAGUE TABLE ─────────────── */}
//         <section id="table" className="px-6 md:px-12 py-16 bg-white">
//           <h3 className="text-3xl font-bold mb-6">League Table</h3>
//           <LeagueTable data={leagueTable} />
//         </section>

//         {/* ─────────────── NEWS ─────────────── */}
//         <section id="news" className="px-6 md:px-12 py-16 bg-gray-50">
//           <h3 className="text-3xl font-bold mb-6">Latest News</h3>
//           <div className="grid md:grid-cols-3 gap-6">
//             {newsItems.map((n, i) => (
//               <NewsCard key={i} {...n} />
//             ))}
//           </div>
//         </section>

//         {/* ─────────────── FOOTER ─────────────── */}
//         <footer className="bg-emerald-800 text-white py-8">
//           <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
//             <div className="font-bold">
//               FootBook © {new Date().getFullYear()}
//             </div>
//             <div className="text-sm text-white/80">
//               Built for fans. Connect APIs for live data.
//             </div>
//           </div>
//         </footer>
//       </main>
//     </div>
//   );
// }
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
  const yHero = useTransform(scrollY, [0, 600], [0, -150]);
  const scaleHero = useTransform(scrollY, [0, 600], [1, 1.2]);
  const yFootball = useTransform(scrollY, [0, 600], [0, 100]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* LOADER */}
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

      {/* HEADER & MENU */}
      <Header onOpenMenu={() => setMenuOpen(true)} />
      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <motion.h1
            style={{ y: yHero, scale: scaleHero }}
            className={styles.heroTitle}
          >
            FOOTBOOK
          </motion.h1>

          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h2 className={styles.heroHeading}>
                Live Premier League action — in your hands
              </h2>
              <p className={styles.heroSub}>
                Real-time scores, fixtures, tables, and news — designed for fans
                who can’t miss a second.
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
