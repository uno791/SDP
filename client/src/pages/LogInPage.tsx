import * as React from "react";
import styles from "../components/LogInPageComp/LoginPage.module.css";

import { WelcomeMessage } from "../components/LogInPageComp/WelcomeMessage";
import { GoogleLogInButton } from "../components/LogInPageComp/GoogleLoginButton";
import { SignUpPrompt } from "../components/LogInPageComp/SignUpPrompt";

// login page component
export default function LoginPage() {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  return (
    <main className={styles.pageWrapper}>
      <section className={styles.loginContainer}>
        {/* greeting text */}
        <WelcomeMessage />

        {/* login button using google auth */}
        <GoogleLogInButton
          onError={(msg: string) => setErrorMessage(msg)}
          onSuccessMessage={(msg: string) => setSuccessMessage(msg)}
        />

        {/* bottom prompt to signup */}
        <SignUpPrompt />

        {/* display error popup */}
        {errorMessage && (
          <section
            className={styles.popupError}
            style={{ zIndex: 1000 }}
            aria-live="assertive"
          >
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)}>Close</button>
          </section>
        )}

        {/* display success popup */}
        {successMessage && (
          <section
            className={styles.popupSuccess}
            style={{ zIndex: 1000 }}
            aria-live="polite"
          >
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)}>Close</button>
          </section>
        )}
      </section>
    </main>
  );
}
