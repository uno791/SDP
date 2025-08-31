import React from "react";
import styles from "./UsernameDisplay.module.css";

interface UsernameDisplayProps {
  username: string;
}

const UsernameDisplay: React.FC<UsernameDisplayProps> = ({ username }) => {
  return (
    <div className={styles.usernameContainer}>
      <h2 className={styles.username}>{username}</h2>
    </div>
  );
};

export default UsernameDisplay;
