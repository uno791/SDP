import React from "react";
import styles from "./FootballHomePage.module.css";

function FootballHomePage() {
  return (
    <div className={styles.homePage}>
      <div className={styles.mainContainer}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.leftColumn}>
              <div className={styles.logoContainer}>
                <div className={styles.footBookLogo}>Foot Book</div>
                <div className={styles.liveButton}>LIVE</div>
              </div>
            </div>
            <div className={styles.rightColumn}>
              <div className={styles.navigationMenu}>
                <div className={`${styles.navButton} ${styles.homeButton}`}>HOME</div>
                <div className={styles.navButton}>NEWS</div>
                <div className={styles.navButton}>FAVOURITE TEAMS</div>
                <div className={styles.navButton}>PROFILE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.contentWrapper}>
          <div className={styles.contentGrid}>
            {/* Left Main Content */}
            <div className={styles.mainContent}>
              {/* Live League Games Section */}
              <div className={styles.liveGamesSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.headerLeft}>
                    <div className={styles.sectionTitle}>LIVE LEAGUE GAMES</div>
                    <div className={styles.sectionDate}>Monday 18 August</div>
                  </div>
                  <div className={styles.dateControls}>
                    <div className={styles.dateArrow}>←</div>
                    <div className={styles.dateSelector}>
                      <div className={styles.dateLabel}>Date</div>
                      <div className={styles.dateInput}></div>
                    </div>
                    <div className={styles.dateArrow}>→</div>
                  </div>
                </div>

                {/* Match Cards */}
                <div className={styles.matchCard}>
                  <div className={styles.matchInfo}>
                    <div className={styles.teamLeft}>
                      <span className={styles.teamName}>Liverpool</span>
                      <div className={styles.liveTag}>LIVE</div>
                    </div>
                    <div className={styles.scoreSection}>
                      <span className={styles.score}>0 - 1</span>
                      <span className={styles.matchTime}>67'</span>
                    </div>
                    <div className={styles.teamRight}>
                      <span className={styles.teamName}>Man United</span>
                      <div className={styles.starTag}>★</div>
                    </div>
                  </div>
                </div>

                <div className={styles.matchCard}>
                  <div className={styles.matchInfoHorizontal}>
                    <span className={styles.teamName}>Arsenal</span>
                    <div className={styles.liveTag}>LIVE</div>
                    <div className={styles.scoreGroup}>
                      <span className={styles.score}>0 - 10</span>
                      <span className={styles.matchTime}>23'</span>
                    </div>
                    <div className={styles.teamEndGroup}>
                      <span className={styles.teamName}>Chelsea</span>
                      <div className={styles.starTag}>★</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past League Games Section */}
              <div className={styles.pastGamesSection}>
                <div className={styles.sectionTitle}>PAST LEAGUE GAMES</div>
                <div className={styles.sectionDate}>Monday 18 August</div>
                <div className={styles.emptyMatchCard}></div>
                <div className={styles.emptyMatchCard}></div>
                <div className={styles.emptyMatchCard}></div>
                <div className={styles.emptyMatchCard}></div>
              </div>

              {/* Live Streams Section */}
              <div className={styles.liveStreamsSection}>
                <div className={styles.streamIcon}>📺</div>
                <div className={styles.streamTitle}>LIVE STREAMS</div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className={styles.sidebar}>
              {/* Premier League Table */}
              <div className={styles.leagueTableSection}>
                <div className={styles.tableTitle}>PREMIER LEAGUE TABLE</div>
                <div className={styles.tableHeader}>
                  <div className={styles.headerLeft}>
                    <span>POS</span>
                    <span>TEAM</span>
                  </div>
                  <div className={styles.headerRight}>
                    <span>P</span>
                    <span>W</span>
                    <span>PTS</span>
                  </div>
                </div>
                
                <div className={`${styles.tableRow} ${styles.topTeam}`}>
                  <span>1</span>
                  <div className={styles.teamInfo}>
                    <span>Man United</span>
                    <span>20</span>
                  </div>
                  <div className={styles.stats}>
                    <span>20</span>
                    <span>72</span>
                  </div>
                </div>

                <div className={`${styles.tableRow} ${styles.topTeam}`}>
                  <span>2</span>
                  <span>Arsenal</span>
                  <span>20</span>
                  <span>13</span>
                  <span>43</span>
                </div>

                <div className={styles.tableRow}>
                  <span>3</span>
                  <div className={styles.teamStats}>
                    <span>Man City</span>
                    <span>19</span>
                    <span>12</span>
                    <span>40</span>
                  </div>
                </div>

                <div className={styles.tableRow}>
                  <span>4</span>
                  <span className={styles.teamNameCell}>Aston Villa</span>
                  <div className={styles.teamStatsGroup}>
                    <span>20</span>
                    <span>12</span>
                    <span>39</span>
                  </div>
                </div>

                <div className={styles.tableRow}>
                  <span>5</span>
                  <span>Tottenham</span>
                  <span>20</span>
                  <span>11</span>
                  <span>36</span>
                </div>

                <div className={styles.tableRow}>
                  <span>6</span>
                  <span>Liverpool</span>
                  <span>20</span>
                  <span>10</span>
                  <span>33</span>
                </div>
              </div>

              {/* Latest News Section */}
              <div className={styles.newsSection}>
                <div className={styles.newsTitle}>LATEST NEWS</div>
                
                <div className={styles.newsCard}>
                  <div className={styles.newsHeader}>
                    <div className={styles.newsTag}>MATCH REPORT</div>
                    <span className={styles.newsTime}>2 hours ago</span>
                  </div>
                  <div className={styles.newsTitle2}>Liverpool Extend Lead at Top After Victory Over United</div>
                  <div className={styles.newsText}>The Reds secured a crucial 2-1 win at Anfield to maintain their position at the summit of the Premier League table.</div>
                </div>

                <div className={styles.newsCard}>
                  <div className={styles.newsHeader}>
                    <div className={styles.newsTag}>TRANSFERS</div>
                    <span className={styles.newsTime}>4 hours ago</span>
                  </div>
                  <div className={styles.newsText}>The Gunners have completed the signing of a promising young forward to bolster their attacking options.</div>
                </div>

                <div className={styles.newsCard}>
                  <div className={styles.newsHeader}>
                    <div className={styles.newsTag}>ANALYSIS</div>
                    <span className={styles.newsTime}>6 hours ago</span>
                  </div>
                  <div className={styles.newsTitle2}>VAR Controversy Rocks Premier League Weekend</div>
                  <div className={styles.newsText}>Several contentious decisions have sparked debate among fans and pundits across multiple fixtures.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footerSection}>
          <div className={styles.footerMain}>
            <div className={styles.footerContent}>
              <div className={styles.ctaBox}>NEVER MISS A MOMENT!</div>
              <div className={styles.ctaText}>Join millions of Premier League fans getting live updates, scores, and highlights</div>
              <div className={styles.ctaButtons}>
                <div className={styles.signUpButton}>SIGN UP FREE</div>
                <div className={styles.loginButton}>LOG IN</div>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.copyright}>© 2024 Premier League Live Feed. All rights reserved. POW! BAM! FOOTBALL!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FootballHomePage;
