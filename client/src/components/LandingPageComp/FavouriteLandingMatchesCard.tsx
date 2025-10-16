import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PastMatchCard from "./PastMatchCard";
import type { LeagueId } from "../../api/espn";
import { baseURL } from "../../config";
import { useUser } from "../../Users/UserContext";
import styles from "./PastMatchCard.module.css";

type Props = {
  league: LeagueId;
};

type FavouriteApiRow = {
  team_id?: number;
  team_name?: string;
  teamName?: string;
  name?: string;
};

export default function FavouriteLandingMatchesCard({ league }: Props) {
  const { user } = useUser();
  const [teamNames, setTeamNames] = useState<string[] | null>(null);
  const [loadingFavourites, setLoadingFavourites] = useState<boolean>(false);
  const [favErr, setFavErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setTeamNames([]);
      setFavErr(null);
      setLoadingFavourites(false);
      return;
    }

    let alive = true;
    setLoadingFavourites(true);
    setFavErr(null);

    (async () => {
      try {
        const res = await axios.get(`${baseURL}/favourite-teams/${user.id}`);
        if (!alive) return;
        const rows: FavouriteApiRow[] = Array.isArray(res.data)
          ? res.data
          : [];
        const names = rows
          .map(
            (row) =>
              row.team_name ||
              row.teamName ||
              row.name ||
              (row as any)?.team?.name
          )
          .filter((name): name is string => {
            if (typeof name !== "string") return false;
            return name.trim().length > 0;
          })
          .map((name) => name.trim());

        setTeamNames(Array.from(new Set(names)));
      } catch (error: any) {
        if (!alive) return;
        setFavErr(
          error?.message ?? "Failed to load favourite team preferences."
        );
        setTeamNames([]);
      } finally {
        if (alive) setLoadingFavourites(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const emptyMessage = useMemo(() => {
    if (!user?.id) {
      return "Sign in and follow teams to see favourite matches here.";
    }
    if (favErr) {
      return favErr;
    }
    if ((teamNames ?? []).length === 0) {
      return "Follow teams to see their fixtures here.";
    }
    return "No favourite team matches.";
  }, [favErr, teamNames, user?.id]);

  if (loadingFavourites || teamNames === null) {
    return (
      <>
        <div className={styles.headerRow}>
          <h3 className={styles.headerTitle}>Favourite Team Matches</h3>
        </div>
        <div className={styles.state}>Loading favourite teams…</div>
      </>
    );
  }

  return (
    <PastMatchCard
      league={league}
      title="Favourite Team Matches"
      teamNames={teamNames ?? []}
      emptyMessage={emptyMessage}
    />
  );
}
