"use client";
import * as React from "react";
import styles from "../components/SignUpPageComp/SignUpPage.module.css";
import { GoogleSignUpButton } from "../components/SignUpPageComp/GoogleSignUpButton";
import { LoginPrompt } from "../components/SignUpPageComp/LoginPrompt";

export default function SignUpPage() {
  return (
    <main className={styles.pageContainer}>
      {/* <Logo /> */}
      <h1 className={styles.welcomeHeading}>pls sign up</h1>
      <GoogleSignUpButton />
      <LoginPrompt />
    </main>
  );
}
