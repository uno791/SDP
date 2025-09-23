import styles from "./MatchList.module.css";
import MatchCard from "./MatchCard";

type Match = {
  id: number;
  team1: string;
  team2: string;
  score: string;
  status: "live" | "upcoming" | "finished";
  minute?: number;
  date?: string;
};

interface Props {
  title: string;
  matches: Match[];
  onSeeMore?: (id: number) => void;
  subtitle?: string;
  accent?: "live" | "upcoming" | "past";
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const MatchList = ({ title, matches, onSeeMore, subtitle, accent }: Props) => {
  const accentClass = accent ? styles[`accent${capitalize(accent)}`] : "";
  const emptyMessage = `No ${title.toLowerCase()} to show right now.`;

  return (
    <section className={`${styles.section} ${accentClass}`.trim()}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {matches.length === 0 ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <div className={styles.cards}>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} onSeeMore={onSeeMore} />
          ))}
        </div>
      )}
    </section>
  );
};

export default MatchList;
