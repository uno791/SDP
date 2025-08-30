import React from "react";
import styles from "./AuthPanel.module.css";
import { FcGoogle } from "react-icons/fc";

interface AuthPanelProps {
  type: "signup" | "login";
  image: string;
  side: "left" | "right"; // 👈 new prop
}

const AuthPanel: React.FC<AuthPanelProps> = ({ type, image, side }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>
        {type === "signup" ? "SIGN UP" : "LOGIN"}
      </h2>

      {/* dynamically apply illustration class */}
      <img
        src={image}
        alt={type}
        className={
          side === "left" ? styles.illustrationleft : styles.illustrationright
        }
      />

      <button className={styles.googleBtn}>
        <FcGoogle className={styles.googleIcon} />
        {type === "signup" ? "SIGN UP" : "LOGIN"} WITH GOOGLE
      </button>

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
