import React from "react";
import styles from "./AuthPanel.module.css";
import GoogleSignUpButton from "../GoogleButtons/GoogleSignupButton";
import GoogleLogInButton from "../GoogleButtons/GoogleLogInButton";

interface AuthPanelProps {
  type: "signup" | "login";
  image: string;
  side: "left" | "right";
}

const AuthPanel: React.FC<AuthPanelProps> = ({ type, image, side }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        {type === "signup" ? "SIGN UP" : "LOGIN"}
      </h2>

      <img
        src={image}
        alt={type}
        className={
          side === "left" ? styles.illustrationleft : styles.illustrationright
        }
        loading={side === "left" ? "eager" : "lazy"}
        decoding="async"
      />

      {type === "signup" ? <GoogleSignUpButton /> : <GoogleLogInButton />}

      <p className={styles.switchText}>
        {type === "signup" ? (
          <>
            Already have an account? <a href="#">Login →</a>
          </>
        ) : (
          <>
            Don’t have an account? <a href="#">←Create your account!</a>
          </>
        )}
      </p>
    </div>
  );
};

export default AuthPanel;
