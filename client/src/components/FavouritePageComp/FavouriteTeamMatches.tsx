import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchScoreboard,
  type LeagueId,
  type ScoreboardResponse,
  extractStatsFromScoreboardEvent,
} from "../../api/espn";
import { DEFAULT_LEAGUE, LEAGUE_OPTIONS } from "./leagues";
import MatchCard from "../HomePageComp/MatchCard/MatchCard";
import styles from "./FavouriteTeamMatches.module.css";

type FavouriteTeamMatchesProps = {
  teamNames: string[];
};

function compareDay(a: Date, b: Date) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aa === bb ? 0 : aa < bb ? -1 : 1;
}

const normalizeName = (value: string | undefined | null) =>
  value?.toLowerCase().trim() ?? "";

export default function FavouriteTeamMatches({
  teamNames,
}: FavouriteTeamMatchesProps) {
  const [league, setLeague] = useState<LeagueId>(DEFAULT_LEAGUE);
  const [date, setDate] = useState<Date>(() => new Date());
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasInitialised, setHasInitialised] = useState<boolean>(false);

  const today = useMemo(() => new Date(), []);
  const teamNameSet = useMemo(() => {
    const normalized = teamNames
      .map((name) => normalizeName(name))
      .filter(Boolean);
    return new Set(normalized);
  }, [teamNames]);
  const teamKey = useMemo(
    () => [...teamNameSet].sort().join("|"),
    [teamNameSet]
  );

  const selectEvents = useCallback(
    (sb: ScoreboardResponse | null, cmp: number) => {
      if (!sb) return [];

      const relevantByState = (sb.events ?? []).filter((ev) => {
        const st = ev.status?.type;
        const isCompleted = !!st?.completed || st?.state === "post";
        const isUpcoming = st?.state === "pre" && !st?.completed;
        return cmp > 0 ? isUpcoming : isCompleted;
      });

      const favouritesOnly = relevantByState.filter((ev) => {
        const comp = ev.competitions?.[0];
        const competitors = comp?.competitors ?? [];

        return competitors.some((competitor) => {
          const team = competitor?.team;
          const namesToCheck = [
            team?.displayName,
            team?.shortDisplayName,
            team?.name,
            team?.abbreviation,
            team?.nickname,
            team?.nickName,
          ];

          return namesToCheck.some((name) =>
            teamNameSet.has(normalizeName(name))
          );
        });
      });

      return favouritesOnly
        .slice()
        .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    },
    [teamNameSet]
  );

  const hasLive = useMemo(
    () => (data?.events ?? []).some((ev) => ev?.status?.type?.state === "in"),
    [data]
  );

  const [visible, setVisible] = useState<boolean>(() => !document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const load = useCallback(async () => {
    if (!teamKey) {
      setData(null);
      setErr(null);
      setLoading(false);
      return;
    }

    try {
      const sb = await fetchScoreboard(date, league);
      setData(sb);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load scoreboard");
    } finally {
      setLoading(false);
    }
  }, [date, teamKey, league]);

  const skipNextFetchRef = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    if (!teamKey) {
      skipNextFetchRef.current = false;
      setData(null);
      setErr(null);
      setLoading(false);
      setHasInitialised(true);
      return;
    }

    setHasInitialised(false);
    setLoading(true);
    setErr(null);
    setData(null);

    const baseToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const lookbackDays = 60;

    const findLatestFavouriteDate = async () => {
      for (let offset = 0; offset < lookbackDays; offset += 1) {
        const candidate = new Date(
          baseToday.getFullYear(),
          baseToday.getMonth(),
          baseToday.getDate() - offset
        );

        try {
          const sb = await fetchScoreboard(candidate, league);
          if (cancelled) return;

          const filtered = selectEvents(sb, compareDay(candidate, today));
          if (filtered.length > 0) {
            skipNextFetchRef.current = true;
            setData(sb);
            setErr(null);
            setHasInitialised(true);
            setDate(candidate);
            setLoading(false);
            return;
          }
        } catch (e: any) {
          if (cancelled) return;
          setErr(e?.message ?? "Failed to load scoreboard");
          setHasInitialised(true);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) {
        skipNextFetchRef.current = true;
        setData(null);
        setErr(null);
        setHasInitialised(true);
        setLoading(false);
        setDate(baseToday);
      }
    };

    findLatestFavouriteDate();

    return () => {
      cancelled = true;
    };
  }, [teamKey, league, today, selectEvents]);

  useEffect(() => {
    if (!hasInitialised) return;
    if (!teamKey) {
      skipNextFetchRef.current = false;
      setData(null);
      setErr(null);
      setLoading(false);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    setLoading(true);
    load();
  }, [date, load, teamKey, hasInitialised]);

  const timerRef = useRef<number | null>(null);
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!visible || !teamKey || !hasInitialised) {
      clearTimer();
      return;
    }

    const normalDelayMs = hasLive ? 10_000 : 60_000;

    const tick = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        await load();
        timerRef.current = window.setTimeout(tick, normalDelayMs);
      } catch {
        timerRef.current = window.setTimeout(tick, 5_000);
      } finally {
        pollingRef.current = false;
      }
    };

    timerRef.current = window.setTimeout(tick, normalDelayMs);
    return clearTimer;
  }, [hasLive, visible, load, teamKey, hasInitialised]);

  const cards = useMemo(() => {
    if (!teamKey) return [];

    const cmp = compareDay(date, today);
    const filteredEvents = selectEvents(data, cmp);

    return filteredEvents.map((ev) => {
      const comp = ev.competitions?.[0];
      const status = ev.status?.type;
      const home = comp?.competitors?.find((c) => c.homeAway === "home");
      const away = comp?.competitors?.find((c) => c.homeAway === "away");
      const mkTeam = (t: any) => ({
        name: t?.team?.shortDisplayName ?? "-",
        score: t?.score,
        logo: t?.team?.logo,
      });

      const statusText =
        cmp > 0
          ? new Date(ev.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : status?.detail ?? "FT";

      const details = extractStatsFromScoreboardEvent(ev);

      return (
        <div className={styles.matchCard} key={ev.id}>
          <MatchCard
            id={ev.id}
            home={mkTeam(home)}
            away={mkTeam(away)}
            state={status?.state as any}
            statusText={statusText}
            metrics={details.metrics}
            saves={details.saves}
            scorers={details.scorers}
          />
        </div>
      );
    });
  }, [data, date, today, teamKey, selectEvents]);

  const renderEmptyState = () => {
    if (!teamKey) {
      return "Follow teams to see their fixtures here.";
    }
    return "No favourite team matches.";
  };

  const handleLeagueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLeague(event.target.value as LeagueId);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Favourite Team Matches</h2>
        <div className={styles.headerControls}>
          {/* Competition Selector */}
          <div className={styles.selectWrap}>
            <label
              htmlFor="favouriteLeagueSelect"
              className={styles.selectLabel}
            >
              Competition
            </label>
            <select
              id="favouriteLeagueSelect"
              className={styles.leagueSelect}
              value={league}
              onChange={handleLeagueChange}
            >
              {LEAGUE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Date Selector (Label only over date box) */}
          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}>Date</label>
            <div className={styles.dateNav}>
              <button
                className={styles.navButton}
                onClick={() =>
                  setDate(
                    (d) =>
                      new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
                  )
                }
                aria-label="Previous day"
              >
                {"<"}
              </button>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <button
                  type="button"
                  className={styles.dateLabel}
                  onClick={() => {
                    const input = document.getElementById(
                      "favouriteLeagueDateInput"
                    ) as HTMLInputElement;
                    input?.showPicker?.();
                    input?.click();
                  }}
                >
                  {date.toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </button>

                <input
                  id="favouriteLeagueDateInput"
                  type="date"
                  className={styles.hiddenDateInput}
                  value={date.toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setDate(new Date(e.target.value));
                  }}
                />
              </div>

              <button
                className={styles.navButton}
                onClick={() =>
                  setDate(
                    (d) =>
                      new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
                  )
                }
                aria-label="Next day"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className={styles.skel}>Loading...</div>}
      {err && <div className={styles.err}>{err}</div>}

      {!loading && !err && cards.length === 0 && (
        <div className={styles.message}>{renderEmptyState()}</div>
      )}
      {!loading && !err && cards}
    </section>
  );
}
