import React from "react";
import styles from "./SignUpPrompt.module.css";
import { Link } from "react-router-dom";

// component definition
export function SignUpPrompt() {
  return (
    <p className={styles.signupText}>
      Don't have an account? Click here to
      <Link to="/SignUpPage">
        <button className={styles.signinLink}>Sign Up!</button>
      </Link>
    </p>
  );
}
