import React from "react";
import styles from "./Login.module.css";
import goalkeeper from "../../assets/goalkeeper.png";

const Login: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>FOOT BOOK</h2>
      <div className={styles.card}>
        <img src={goalkeeper} alt="Goalkeeper" className={styles.image} />
        <p className={styles.text}>"Enter the ultimate football adventure!"</p>
        <button className={styles.button}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          LOGIN WITH GOOGLE
        </button>
        <p className={styles.footer}>
          Don’t have an account? <a href="#">Create your account!</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
