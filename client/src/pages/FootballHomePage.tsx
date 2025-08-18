import React from "react";
import styles from "./FootballHomePage.module.css";
import Header from "../components/HomePageComp/Header";
import MainColumn from "../components/HomePageComp/MainColumn";
import Sidebar from "../components/HomePageComp/Sidebar";
import Footer from "../components/HomePageComp/Footer";

export default function FootballHomePage() {
  return (
    <div className={styles.homePage}>
      <div className={styles.mainContainer}>
        <Header />

        <main className={styles.contentWrapper}>
          <div className={styles.contentGrid}>
            <MainColumn />
            <Sidebar />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
