import React from "react";
import styles from "./LoginPrompt.module.css";
import { Link } from "react-router-dom";

export function LoginPrompt() {
  return (
    <p className={styles.loginText}>
      Already have an account? Click here to
      <Link to="/LogInPage">
        <button className={styles.loginLink}>Log in!</button>
      </Link>
    </p>
  );
}
