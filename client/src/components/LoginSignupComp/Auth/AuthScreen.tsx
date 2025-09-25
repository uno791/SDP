import { Link } from "react-router-dom";
import GoogleLogInButton from "../GoogleButtons/GoogleLogInButton";
import GoogleSignUpButton from "../GoogleButtons/GoogleSignupButton";
import styles from "./AuthScreen.module.css";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  mode: AuthMode;
}

const copy = {
  signup: {
    eyebrow: "Create account",
    title: "Begin your Footbook journey",
    subtitle: "Unlock live dashboards, real-time commentary, and community banter.",
    googleLabel: "Sign up with Google",
    switchPrompt: "Already have an account?",
    switchLinkLabel: "Log in",
    switchHref: "/login",
  },
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to matchday central",
    subtitle: "Live matches tracked, squads synced, ready when you are.",
    googleLabel: "Log in with Google",
    switchPrompt: "New to Footbook?",
    switchLinkLabel: "Create an account",
    switchHref: "/signup",
  },
} satisfies Record<AuthMode, any>;

const FontImports = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    `}
  </style>
);

const AuthScreen = ({ mode }: AuthScreenProps) => {
  return (
    <div className={styles.page}>
      <FontImports />

      {/* 🔥 Fullscreen background video */}
      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/footy-bg-720.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <header className={styles.header}>
        <div className={styles.brand}>FOOTBOOK</div>
        <Link to="/" className={styles.backLink}>
          ← Back
        </Link>
      </header>

      <main className={styles.body}>
        <section className={styles.card}>
          <span className={styles.eyebrow}>{copy[mode].eyebrow}</span>
          <h1 className={styles.title}>{copy[mode].title}</h1>
          <p className={styles.subtitle}>{copy[mode].subtitle}</p>

          {mode === "signup" ? (
            <GoogleSignUpButton buttonText={copy[mode].googleLabel} />
          ) : (
            <GoogleLogInButton buttonText={copy[mode].googleLabel} />
          )}

          <p className={styles.switchRow}>
            {copy[mode].switchPrompt}{" "}
            <Link className={styles.switchLink} to={copy[mode].switchHref}>
              {copy[mode].switchLinkLabel}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default AuthScreen;
