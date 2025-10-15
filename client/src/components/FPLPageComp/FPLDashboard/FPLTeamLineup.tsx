import styles from "./FPLTeamLineup.module.css";

interface Player {
  id: number;
  web_name: string;
  photo: string;
  element_type: number;
}

interface Pick {
  element: number;
  position: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface Props {
  picks: Pick[];
  players: Record<number, Player>;
}

export default function FPLTeamLineup({ picks, players }: Props) {
  const startingXI = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11);

  // Split by position type
  const gk = startingXI.filter((p) => players[p.element]?.element_type === 1);
  const def = startingXI.filter((p) => players[p.element]?.element_type === 2);
  const mid = startingXI.filter((p) => players[p.element]?.element_type === 3);
  const fwd = startingXI.filter((p) => players[p.element]?.element_type === 4);

  const placeholderImg =
    "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  // or use your own local asset

  const renderPlayer = (pick: Pick) => {
    const player = players[pick.element];
    if (!player) return null;

    const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace(
      ".jpg",
      ".png"
    )}`;

    return (
      <div key={pick.element} className={styles.playerCard}>
        <img
          src={photoUrl}
          alt={player.web_name}
          className={styles.playerImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImg;
          }}
        />
        <p className={styles.playerName}>{player.web_name}</p>
        {pick.is_captain && <span className={styles.badge}>C</span>}
        {pick.is_vice_captain && <span className={styles.badge}>VC</span>}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Starting XI</h3>

      <div className={styles.pitch}>
        <div className={styles.row}>{gk.map(renderPlayer)}</div>
        <div className={styles.row}>{def.map(renderPlayer)}</div>
        <div className={styles.row}>{mid.map(renderPlayer)}</div>
        <div className={styles.row}>{fwd.map(renderPlayer)}</div>
      </div>

      <h3 className={styles.heading}>Bench</h3>
      <div className={styles.bench}>
        {bench.map((p) => {
          const player = players[p.element];
          if (!player) return null;

          const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace(
            ".jpg",
            ".png"
          )}`;

          return (
            <div key={p.element} className={styles.playerCardBench}>
              <img
                src={photoUrl}
                alt={player.web_name}
                className={styles.playerImageBench}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImg;
                }}
              />
              <p className={styles.playerName}>{player.web_name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
