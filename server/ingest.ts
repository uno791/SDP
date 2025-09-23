import supabase from "./supabaseClient"; // make sure path is correct

type IngestArgs = {
  date: string;
  leagues: string[];
  pastDays?: number;
  futureDays?: number;
};

type LeagueIngestSummary = {
  total: number;
  perDate: Record<string, number>;
};

function parseMinute(displayClock?: string | null): number | null {
  if (!displayClock) return null;
  const m = /(\d+)/.exec(displayClock);
  return m ? parseInt(m[1], 10) : null;
}

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateRange(anchor: string, pastDays: number, futureDays: number): string[] {
  const base = new Date(`${anchor}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`Invalid date supplied to ingest: ${anchor}`);
  }

  const dates: string[] = [];
  for (let offset = -pastDays; offset <= futureDays; offset += 1) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push(formatDateUTC(d));
  }
  return dates;
}

async function fetchScoreboard(leagueCode: string, dateYMD: string) {
  const ymd = dateYMD.replace(/-/g, "");
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${ymd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scoreboard fetch failed ${res.status}`);
  return res.json();
}

export async function ingestDay({
  date,
  leagues,
  pastDays = 0,
  futureDays = 0,
}: IngestArgs) {
  const past = Math.max(0, pastDays);
  const future = Math.max(0, futureDays);
  const targetDates = buildDateRange(date, past, future);

  const perLeagueCount: Record<string, LeagueIngestSummary> = {};

  for (const league of leagues) {
    const perDate: Record<string, number> = {};
    let totalForLeague = 0;

    for (const targetDate of targetDates) {
      const sb = await fetchScoreboard(league, targetDate);
      const events = sb?.events ?? [];
      perDate[targetDate] = events.length;
      totalForLeague += events.length;

      for (const ev of events) {
        const comp = ev?.competitions?.[0] ?? {};
        const teams = comp?.competitors ?? [];
        const home = teams.find((c: any) => c?.homeAway === "home") ?? {};
        const away = teams.find((c: any) => c?.homeAway === "away") ?? {};
        const hT = home.team ?? {};
        const aT = away.team ?? {};

        // --- Teams (skip if no name)
        if (!hT?.name || !aT?.name) continue;

        const { data: hData, error: hErr } = await supabase
          .from("teams")
          .upsert(
            {
              name: hT.name,
              short_name: hT?.shortDisplayName ?? null,
              abbreviation: hT?.abbreviation ?? null,
              display_name: hT?.displayName ?? null,
              logo_url: hT?.logo ?? null,
            },
            { onConflict: "name" }
          )
          .select("id")
          .single();
        if (hErr) throw hErr;
        const home_team_id = hData.id;

        const { data: aData, error: aErr } = await supabase
          .from("teams")
          .upsert(
            {
              name: aT.name,
              short_name: aT?.shortDisplayName ?? null,
              abbreviation: aT?.abbreviation ?? null,
              display_name: aT?.displayName ?? null,
              logo_url: aT?.logo ?? null,
            },
            { onConflict: "name" }
          )
          .select("id")
          .single();
        if (aErr) throw aErr;
        const away_team_id = aData.id;

        // --- Venue (use unique on name,city)
        const venue = comp?.venue ?? {};
        let venue_id: number | null = null;
        if (venue?.fullName) {
          const { data: vData, error: vErr } = await supabase
            .from("venues")
            .upsert(
              {
                name: venue.fullName,
                city: venue?.address?.city ?? null,
                country: venue?.address?.country ?? null,
              },
              { onConflict: "name,city" }
            )
            .select("id")
            .single();
          if (vErr) throw vErr;
          venue_id = vData.id;
        }

        // --- Match
        const utc_kickoff = ev?.date as string;
        const season_year = ev?.season?.year ?? null;
        const week_number = ev?.week?.number ?? null;
        const state = comp?.status?.type?.state || "scheduled"; // 'pre'|'in'|'post'
        const status_detail = comp?.status?.type?.shortDetail ?? null;
        const minute = parseMinute(comp?.status?.displayClock);
        const attendance = comp?.attendance ?? null;
        const home_score = home?.score != null ? Number(home.score) : null;
        const away_score = away?.score != null ? Number(away.score) : null;

        const { error: mErr } = await supabase.from("matches").upsert(
          {
            league_code: league,
            season_year,
            week_number,
            utc_kickoff,
            status: state,
            status_detail,
            minute,
            attendance,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            venue_id,
          },
          { onConflict: "league_code,utc_kickoff,home_team_id,away_team_id" }
        );
        if (mErr) throw mErr;
      }
    }

    perLeagueCount[league] = {
      total: totalForLeague,
      perDate,
    };
  }

  return { dates: targetDates, perLeagueCount };
}
