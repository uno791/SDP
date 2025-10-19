import React from "react";
import { Link } from "react-router-dom";
import styles from "./WhatIsFootbook.module.css";

type OverviewCard = {
  title: string;
  blurb: string;
  stat?: string;
};

type FeatureSection = {
  id: string;
  label: string;
  title: string;
  description: string;
  highlights: string[];
  cta?: { to: string; label: string };
};

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    title: "Live coverage that feels present",
    blurb:
      "Track every key moment with rich commentary, instant stats, standings, and context for any match you follow.",
    stat: "50+ data points per game",
  },
  {
    title: "Create and share fixtures instantly",
    blurb:
      "Log friendlies, tournaments, or training sessions in seconds and invite teammates to keep the details locked in.",
    stat: "2 min setup time",
  },
  {
    title: "Your personal match diary",
    blurb:
      "User Matches keeps upcoming fixtures, past results, and reminders in one scrollable timeline that stays in sync.",
    stat: "All of your clubs, one hub",
  },
  {
    title: "Community-powered watchalongs",
    blurb:
      "Join live rooms, react with friends, and revisit curated recaps the moment the final whistle goes.",
    stat: "Always-on banter",
  },
];

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: "live-coverage",
    label: "Live coverage",
    title: "Follow the match as if you were in the stands",
    description:
      "Footbook’s live centre threads everything together—lineups, events, stats, possession graphs, and commentary—so you never need three tabs to know what’s happening.",
    highlights: [
      "Live commentary stream enriched with momentum, possession, and shot maps.",
      "Dynamic league tables that update instantly when goals go in.",
      "Match viewer with play-by-play context, player ratings, and narrative summaries.",
    ],
  },
  {
    id: "create-matches",
    label: "Create matches",
    title: "Set up fixtures for your crew in seconds",
    description:
      "Whether it’s a five-a-side run, a supporters’ club friendly, or a tournament bracket, the Create Match tool helps you capture the essentials and share them quickly.",
    highlights: [
      "Guided form for opponents, squad lists, kickoff times, venues, and broadcast links.",
      "Shareable links so teammates can confirm availability or suggest edits.",
      "Match records flow straight into User Matches, watchalongs, and live dashboards.",
    ],
    cta: { to: "/create-match", label: "Open Create Match" },
  },
  {
    id: "user-matches",
    label: "User matches",
    title: "Stay on top of the fixtures that matter to you",
    description:
      "The User Matches hub becomes your personal match diary—tracking upcoming fixtures, recent results, reflections, and match resources in one tidy view.",
    highlights: [
      "Timeline view that separates upcoming fixtures from completed matches at a glance.",
      "Deep links into live coverage, commentary, and post-match stats for each game.",
      "Automatic reminders and highlights tailored to the teams you follow.",
    ],
    cta: { to: "/mymatches", label: "View User Matches" },
  },
  {
    id: "favourites",
    label: "Favourites feed",
    title: "One feed tuned to your favourite clubs",
    description:
      "Tell Footbook which teams you adore and we surface fixtures, news, and results automatically—across leagues, cups, and competitions.",
    highlights: [
      "Smart filters highlight your clubs even on crowded matchdays.",
      "Follow multiple teams without losing track of neutral fixtures that matter.",
      "Update favourites from your profile and the feed reshapes instantly.",
    ],
    cta: { to: "/favourite", label: "Explore favourite teams" },
  },
  {
    id: "community",
    label: "Community & watchalongs",
    title: "Bring your friends into the matchday experience",
    description:
      "Watchalong rooms, commentary threads, and match reports keep the conversation flowing before, during, and after the game.",
    highlights: [
      "Create or join watchalong rooms with synchronised updates and reactions.",
      "Share clips, polls, and notes that sit alongside the live commentary.",
      "Revisit curated recaps and talking points once the whistle blows.",
    ],
    cta: { to: "/watchalongs", label: "Jump into a watchalong" },
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Create your free account",
    copy: "Sign up to sync favourites, personalise dashboards, and unlock community features.",
  },
  {
    title: "Tailor your experience",
    copy: "Select preferred leagues, add favourite clubs, and configure match alerts that matter to you.",
  },
  {
    title: "Create or follow matches",
    copy: "Log the fixtures you are organising or attending and invite friends to stay in sync.",
  },
  {
    title: "Stay informed post-match",
    copy: "Dive into live coverage, commentary, and stats, then review recaps and trends once the whistle blows.",
  },
];

export default function WhatIsFootbook() {
  return (
    <main className={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
      `}</style>
      <section className={styles.hero}>
        <p className={styles.tagline}>Discover Footbook</p>
        <h1 className={styles.heroTitle}>Your All-in-One Football Companion</h1>
        <p className={styles.heroLead}>
          Footbook brings fixtures, live data, organiser tools, and community
          experiences together so you never miss the stories that matter to you.
        </p>
        <div className={styles.heroActions}>
          <Link to="/signup" className={styles.primaryAction}>
            Create an account
          </Link>
          <Link to="/" className={styles.secondaryAction}>
            Back to matches
          </Link>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionIntro}`}>
        <span className={styles.sectionSup}>Why Footbook</span>
        <h2 className={styles.sectionTitle}>Everything in one matchday dashboard</h2>
        <p className={styles.sectionLead}>
          Seamless navigation lets you jump from live league tables to match creation
          tools in seconds. Whether you are tracking your club, organising fixtures,
          or joining a watchalong, Footbook keeps the signal high and the noise low.
        </p>
        <nav className={styles.sectionNav} aria-label="Footbook feature navigation">
          {FEATURE_SECTIONS.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.sectionNavButton}>
              <span className={styles.sectionNavDot} aria-hidden="true" />
              {item.label}
            </a>
          ))}
          <a href="#journey" className={styles.sectionNavButton}>
            <span className={styles.sectionNavDot} aria-hidden="true" />
            How it works
          </a>
        </nav>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Footbook at a glance</h2>
        <div className={styles.overviewGrid}>
          {OVERVIEW_CARDS.map((card) => (
            <article key={card.title} className={styles.overviewCard}>
              <h3 className={styles.overviewTitle}>{card.title}</h3>
              <p className={styles.overviewBlurb}>{card.blurb}</p>
              {card.stat && <span className={styles.overviewStat}>{card.stat}</span>}
            </article>
          ))}
        </div>
      </section>

      {FEATURE_SECTIONS.map((feature) => (
        <section
          key={feature.id}
          id={feature.id}
          className={`${styles.section} ${styles.anchorSection}`}
        >
          <div className={styles.anchorHeader}>
            <span className={styles.anchorPill}>{feature.label}</span>
            <h2 className={styles.anchorTitle}>{feature.title}</h2>
          </div>
          <p className={styles.anchorLead}>{feature.description}</p>
          <ul className={styles.highlightList}>
            {feature.highlights.map((point) => (
              <li key={point} className={styles.highlightItem}>
                {point}
              </li>
            ))}
          </ul>
          {feature.cta && (
            <Link to={feature.cta.to} className={styles.anchorCta}>
              {feature.cta.label}
            </Link>
          )}
        </section>
      ))}

      <section id="journey" className={`${styles.section} ${styles.timelineSection}`}>
        <span className={styles.sectionSup}>Getting started</span>
        <h2 className={styles.sectionTitle}>How Footbook fits into your week</h2>
        <p className={styles.sectionLead}>
          From the first login to post-match reflection, Footbook guides you through the
          full lifecycle of every fixture.
        </p>
        <div className={styles.timeline}>
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article key={step.title} className={styles.timelineItem}>
              <span className={styles.timelineNumber}>{index + 1}</span>
              <div className={styles.timelineBody}>
                <h3 className={styles.timelineTitle}>{step.title}</h3>
                <p className={styles.timelineCopy}>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Built for every kind of supporter
        </h2>
        <div className={styles.columns}>
          <div>
            <h3 className={styles.columnHeading}>Casual Fans</h3>
            <p className={styles.columnCopy}>
              Catch kickoff times, quick match summaries, and curated news so
              you can stay in the loop without juggling multiple apps.
            </p>
          </div>
          <div>
            <h3 className={styles.columnHeading}>Match Organisers</h3>
            <p className={styles.columnCopy}>
              Plan friendlies or training games, send invites, and keep players
              updated with shared match hubs and live dashboards.
            </p>
          </div>
          <div>
            <h3 className={styles.columnHeading}>Dedicated Supporters</h3>
            <p className={styles.columnCopy}>
              Follow your club with personalised feeds, join watchalongs, and
              relive every moment through commentary archives.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to make matchdays easier?</h2>
          <p className={styles.ctaCopy}>
            Join fans who rely on Footbook for live coverage, smart analytics,
            and friendly banter.
          </p>
          <div className={styles.ctaActions}>
            <Link to="/signup" className={styles.primaryAction}>
              Get started
            </Link>
            <Link to="/login" className={styles.secondaryAction}>
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
