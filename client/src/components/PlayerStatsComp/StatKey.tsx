import React from "react";
import styles from "./StatKey.module.css";

export default function StatKey() {
  const SECTIONS: { title: string; items: [string, string][] }[] = [
    {
      title: "General Participation",
      items: [
        ["APP", "Appearances"],
        ["SUBIN", "Times subbed on"],
        ["IN/OUT", "Subbed in/out flags"],
      ],
    },
    {
      title: "Discipline",
      items: [
        ["FC", "Fouls committed"],
        ["FA", "Fouls suffered"],
        ["YC", "Yellow cards"],
        ["RC", "Red cards"],
        ["OG", "Own goals"],
      ],
    },
    {
      title: "Goalkeeping (GK only)",
      items: [
        ["GA", "Goals conceded"],
        ["SV", "Saves made"],
        ["SHF", "Shots on target faced"],
      ],
    },
    {
      title: "Attacking Contributions",
      items: [
        ["G", "Goals scored"],
        ["A", "Assists"],
        ["SH", "Total shots"],
        ["ST", "Shots on target"],
        ["OF", "Offsides"],
      ],
    },
  ];

  return (
    <section className={styles.container}>
      <h3 className={styles.heading}>Stat Key</h3>
      <div className={styles.grid}>
        {SECTIONS.map((sec) => (
          <div key={sec.title} className={styles.section}>
            <h4 className={styles.subheading}>{sec.title}</h4>
            <ul className={styles.list}>
              {sec.items.map(([code, desc]) => (
                <li key={code} className={styles.listItem}>
                  <code className={styles.code} data-code={code}>
                    {code}
                  </code>{" "}
                  — {desc}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
