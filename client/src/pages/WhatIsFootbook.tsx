import React from "react";
import { Link } from "react-router-dom";
import styles from "./WhatIsFootbook.module.css";

type Feature = {
  title: string;
  summary: string;
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    title: "Matchday Control Centre",
    summary:
      "Follow live fixtures with rich commentary, live standings, and key match insights without leaving the page.",
    bullets: [
      "Real-time score updates with momentum and possession indicators",
      "Instant lineup reveals, in-match stats, and substitutions",
      "One-click access to deep-dive match viewer for play-by-play context",
    ],
  },
  {
    title: "Create Matches In Seconds",
    summary:
      "Set up custom fixtures for your club, five-a-side squad, or watch party and keep everyone aligned.",
    bullets: [
      "Add opponents, kick-off times, venues, and notes with a streamlined form",
      "Share editable links so teammates can confirm details from any device",
      "Sync created matches with live dashboards and commentary tools automatically",
    ],
  },
  {
    title: "User Matches Hub",
    summary:
      "A personal diary for the matches you organise, attend, or follow—complete with reminders and recaps.",
    bullets: [
      "Track upcoming fixtures and past results in a single timeline",
      "Receive tailored live updates and post-match summaries",
      "Spot trends with quick stats on win rates and attendance",
    ],
  },
  {
    title: "Personalised Favourites Feed",
    summary:
      "Tell Footbook the clubs you care about and we will surface their fixtures, results, and news automatically.",
    bullets: [
      "Smart filtering that highlights your teams across every competition",
      "Match reminders and quick links to watch-alongs and live chats",
      "Integrated profile controls so you can tweak preferences any time",
    ],
  },
  {
    title: "Community Watchalongs & Commentary",
    summary:
      "Share the drama with fellow supporters through real-time chats and curated highlights.",
    bullets: [
      "Live commentary stream with context-rich play descriptions",
      "Watchalong lobby so you can react together in sync",
      "Instant access to post-match breakdowns and stats recaps",
    ],
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Everything in one matchday dashboard
        </h2>
        <p className={styles.sectionLead}>
          Seamless navigation lets you jump from live league tables to scouting
          reports in seconds. Whether you are tracking your club or tuning in as
          a neutral, Footbook keeps the signal high and the noise low.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What you can do with Footbook</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardSummary}>{feature.summary}</p>
              <ul className={styles.cardList}>
                {feature.bullets.map((point) => (
                  <li key={point} className={styles.cardListItem}>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          How Footbook fits into your week
        </h2>
        <div className={styles.stepsGrid}>
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div key={step.title} className={styles.stepCard}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepCopy}>{step.copy}</p>
            </div>
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
