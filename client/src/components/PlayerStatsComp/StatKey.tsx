import React from "react";

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
    <section style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, background: "#fff", marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 8px" }}>Stat Key</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px 24px",
          fontSize: 14,
        }}
      >
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <h4 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{sec.title}</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sec.items.map(([code, desc]) => (
                <li key={code} style={{ marginBottom: 4 }}>
                  <code style={{ fontWeight: 700 }}>{code}</code> — {desc}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
