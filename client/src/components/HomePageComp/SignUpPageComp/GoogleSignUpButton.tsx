"use client";
import React, { useState } from "react";
import styles from "./GoogleSignUpButton.module.css";
import headerStyles from "../Header/Header.module.css"; // same module as header buttons
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User } from "../../../Users/User";
import { useUser } from "../../../Users/UserContext";
import { baseURL } from "../../../config";

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}

export function GoogleSignUpButton() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const { data: userData } = await axios.get<GoogleUserInfo>(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const userId = userData.sub;
        const username = userData.name || "Unnamed";

        const res = await axios.get<{ exists: boolean }>(`${baseURL}/checkID`, {
          params: { user_id: userId },
        });

        if (res.data.exists) {
          setErrorMessage("User already exists. Please log in instead.");
          return;
        }

        await axios.post(`${baseURL}/addUser`, { user_id: userId, username });

        const newUser = new User({ id: userId, username });
        setUser(newUser);
        navigate("/");
      } catch (err) {
        console.error("❌ Failed to fetch user info:", err);
        setErrorMessage("Google login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
      setErrorMessage("Google login failed. Please try again.");
    },
  });

  return (
    <>
      {/* Use the same structure & classes as header ComicButton */}
      <button
        type="button"
        onClick={() => login()}
        aria-label="Sign up with Google"
        className={`${styles.signUpButton} ${headerStyles.comicBrutalButton}`}
      >
        <div className={headerStyles.buttonInner}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/6c2c435e2bfdac1c7aa377094a31133bc82338d0"
            alt="Google logo"
            className={styles.googleIcon}
          />
          {/* make ONLY this text bigger */}
          <span className={`${headerStyles.buttonText} ${styles.bigText}`}>
            Sign Up with Google
          </span>
          <div className={headerStyles.halftoneOverlay}></div>
          <div className={headerStyles.inkSplatter}></div>
        </div>
        <div className={headerStyles.buttonShadow}></div>
        <div className={headerStyles.buttonFrame}></div>
      </button>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <p>{errorMessage}</p>
        </div>
      )}
    </>
  );
}
