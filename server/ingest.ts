import supabase from "./supabaseClient"; // make sure path is correct

function parseMinute(displayClock?: string | null): number | null {
  if (!displayClock) return null;
  const m = /(\d+)/.exec(displayClock);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchScoreboard(leagueCode: string, dateYMD: string) {
  const ymd = dateYMD.replace(/-/g, "");
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/scoreboard?dates=${ymd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Scoreboard fetch failed ${res.status}`);
  return res.json();
}

export async function ingestDay({ date, leagues }: { date: string; leagues: string[] }) {
  const perLeagueCount: Record<string, number> = {};

  for (const league of leagues) {
    const sb = await fetchScoreboard(league, date);
    const events = sb?.events ?? [];
    perLeagueCount[league] = events.length;

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

  return perLeagueCount;
}
