import { Link } from "react-router-dom";

import GoogleLogInButton from "../GoogleButtons/GoogleLogInButton";
import GoogleSignUpButton from "../GoogleButtons/GoogleSignupButton";

import styles from "./AuthScreen.module.css";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  mode: AuthMode;
}

type Feature = { icon: string; text: string };

const copy = {
  signup: {
    eyebrow: "Create account",
    title: "Begin your Footbook journey",
    subtitle:
      "Unlock live dashboards, curated alerts, and supporter feeds as soon as the whistle blows.",

    googleLabel: "Sign up with Google",
    switchPrompt: "Already have an account?",
    switchLinkLabel: "Log in",
    switchHref: "/login",
    pillLabel: "Live right now",
    features: [
      { icon: "⚡", text: "Customise match alerts for every club you follow." },
      {
        icon: "📊",
        text: "Dive into dynamic stats and fixtures the moment you arrive.",
      },
      {
        icon: "🤝",
        text: "Sync across devices with a single secure Google identity.",
      },
    ] as Feature[],
    statHighlight: {
      label: "Supporters onboard",
      value: "48K",
      detail: "+2.1K this week",
    },
  },
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to matchday central",
    subtitle:
      "Pick up where you left off with live commentary, curated stats, and personalised watchlists.",
    message:
      "Use your Google account to jump straight into the action. Email logins will return soon.",
    googleLabel: "Log in with Google",
    switchPrompt: "New to Footbook?",
    switchLinkLabel: "Create an account",
    switchHref: "/signup",
    pillLabel: "Tonight's fixtures",
    features: [
      {
        icon: "🎯",
        text: "Resume curated feeds tailored to your favourite clubs.",
      },
      {
        icon: "🚨",
        text: "Stay synced with live score pushes and commentary streams.",
      },
      {
        icon: "🔒",
        text: "Secure, single-click access powered entirely by Google.",
      },
    ] as Feature[],
    statHighlight: {
      label: "Live matches tracked",
      value: "26",
      detail: "across five leagues",
    },
  },
} satisfies Record<AuthMode, any>;

const fixtures = [
  { home: "Arsenal", away: "Liverpool", time: "19:45" },
  { home: "Newcastle", away: "Spurs", time: "20:10" },
  { home: "Brighton", away: "Chelsea", time: "21:05" },
];

const FontImports = () => (
  <style className={styles.fontImports}>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    `}
  </style>
);

const AuthScreen = ({ mode }: AuthScreenProps) => {
  const showcaseStats = copy[mode].statHighlight;

  return (
    <div className={styles.page}>
      <FontImports />

      <header className={styles.header}>
        <div className={styles.brand}>FOOTBOOK</div>
        <Link to="/" className={styles.backLink}>
          ← Back to landing
        </Link>
      </header>

      <main className={styles.body}>
        <div className={styles.surface}>
          <section className={styles.panel}>
            <span className={styles.eyebrow}>{copy[mode].eyebrow}</span>
            <h1 className={styles.title}>{copy[mode].title}</h1>
            <p className={styles.subtitle}>{copy[mode].subtitle}</p>

            <ul className={styles.featureList}>
              {copy[mode].features.map((feature) => (
                <li key={feature.text} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            {mode === "signup" ? (
              <GoogleSignUpButton buttonText={copy[mode].googleLabel} />
            ) : (
              <GoogleLogInButton buttonText={copy[mode].googleLabel} />
            )}

            <p className={styles.switchRow}>
              {copy[mode].switchPrompt}
              <Link className={styles.switchLink} to={copy[mode].switchHref}>
                {copy[mode].switchLinkLabel}
              </Link>
            </p>
          </section>

          <aside className={styles.showcase}>
            <span className={styles.pill}>{copy[mode].pillLabel}</span>
            <div className={styles.statBoard}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{showcaseStats.label}</div>
                <div className={styles.statValue}>{showcaseStats.value}</div>
                <div className={styles.statDetail}>{showcaseStats.detail}</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statLabel}>Next fixtures</div>
                <div className={styles.fixtureList}>
                  {fixtures.map((fixture) => (
                    <div key={fixture.home} className={styles.fixtureRow}>
                      <span>
                        {fixture.home} vs {fixture.away}
                      </span>
                      <span>{fixture.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.quote}>
              “Footbook keeps our squad synced with the stands – live stats,
              instant alerts, and zero fuss.”
              <div className={styles.quoteAuthor}>— Premier League Analyst</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AuthScreen;
