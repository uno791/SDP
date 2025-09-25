import { type ReactNode } from "react";

import ComicCard from "./ComicCard";
import GameSummaryCard from "./GameSummaryCard";
import TriStatRow from "./TriStatRow";

import styles from "./MatchView.module.css";

export type MatchViewerSectionRow = {
  label: string;
  left: ReactNode;
  right: ReactNode;
};

export type MatchViewerSection = {
  title: string;
  rows?: MatchViewerSectionRow[];
  content?: ReactNode;
};

type Props = {
  title: string;
  subtitle?: string | null;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  statusText?: string | null;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  homeScorers: string[];
  awayScorers: string[];
  sections: MatchViewerSection[];
  goalHighlight?: boolean;
  overlay?: ReactNode;
};

export default function MatchViewerContent({
  title,
  subtitle = "Match Statistics",
  homeName,
  awayName,
  homeScore,
  awayScore,
  statusText,
  homeLogoUrl,
  awayLogoUrl,
  homeScorers,
  awayScorers,
  sections,
  goalHighlight = false,
  overlay,
}: Props) {
  return (
    <ComicCard>
      <div className={styles.container}>
        {overlay}

        <h1 className={styles.heading}>{title}</h1>
        {subtitle ? <div className={styles.subheading}>{subtitle}</div> : null}

        <GameSummaryCard
          homeName={homeName}
          awayName={awayName}
          homeScore={homeScore}
          awayScore={awayScore}
          statusText={statusText ?? null}
          homeLogoUrl={homeLogoUrl ?? undefined}
          awayLogoUrl={awayLogoUrl ?? undefined}
          homeScorers={homeScorers}
          awayScorers={awayScorers}
          className={goalHighlight ? "animate-goal" : undefined}
        />

        {sections
          .filter((section) =>
            Boolean((section.rows && section.rows.length) || section.content)
          )
          .map((section, idx) => (
            <section key={`${section.title}-${idx}`} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>

              {section.rows?.map((row, rowIdx) => (
                <TriStatRow
                  key={`${row.label}-${rowIdx}`}
                  label={row.label}
                  left={row.left}
                  right={row.right}
                />
              ))}

              {section.content}
            </section>
          ))}
      </div>
    </ComicCard>
  );
}
