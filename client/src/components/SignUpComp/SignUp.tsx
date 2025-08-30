import React from "react";
import styles from "./SignUp.module.css";
import playerKick from "../../assets/player-kick.png";

const SignUp: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>FOOT BOOK</h2>
      <div className={styles.card}>
        <img
          src={playerKick}
          alt="Football player kicking"
          className={styles.image}
        />
        <p className={styles.text}>
          "The ultimate football tracking experience awaits you!"
        </p>
        <button className={styles.button}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          SIGN UP WITH GOOGLE
        </button>
        <p className={styles.footer}>
          Already have an account? <a href="#">Login!</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
