import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MyMatches.module.css";
import MatchList from "../../components/MatchPageComp/MatchList";
import { baseURL } from "../../config";
import { useUser } from "../../Users/UserContext";

type Match = {
  id?: number; // ✅ made optional
  match_id?: number; // ✅ added fallback support
  home_team?: { id: number; name: string } | null;
  away_team?: { id: number; name: string } | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  utc_kickoff: string;
  minute?: number | null;
  notes_json?: {
    duration?: string | number;
    privacy?: string;
    invitedUsers?: string[];
    lineupTeam1?: string[];
    lineupTeam2?: string[];
  };
};

const MyMatches = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(
    () => !user?.id
  );

  // NEW: track which match to delete
  const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null);

  useEffect(() => {
    setShowAuthModal(!user?.id);
  }, [user?.id]);

  useEffect(() => {
    if (!showAuthModal) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [showAuthModal]);

  useEffect(() => {
    if (!user?.id) return;

    // ✅ build URL with created_by + user context
    const url = new URL(`${baseURL}/matches`);
    url.searchParams.set("created_by", user.id); // only matches created by this user
    if (user?.id) url.searchParams.set("user_id", user.id);
    if (user?.username) url.searchParams.set("username", user.username);

    axios
      .get(url.toString())
      .then((res) => {
        setMatches(res.data.matches || []);
      })
      .catch((err) => {
        console.error("Failed to fetch matches:", err);
      });
  }, [user?.id, user?.username]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= kickoff && now.getTime() < end;
  });

  const upcomingMatches = matches.filter((m) => {
    if (m.status === "final") return false;
    const kickoff = new Date(m.utc_kickoff).getTime();
    return now.getTime() < kickoff;
  });

  const pastMatches = matches.filter((m) => {
    if (m.status === "final") return true;
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;
    return now.getTime() >= end;
  });

  const transform = (m: Match) => {
    const kickoff = new Date(m.utc_kickoff).getTime();
    const duration = Number(m.notes_json?.duration ?? 90);
    const end = kickoff + duration * 60000;

    let status: "live" | "upcoming" | "finished";
    if (m.status === "final" || now.getTime() >= end) {
      status = "finished";
    } else if (now.getTime() < kickoff) {
      status = "upcoming";
    } else {
      status = "live";
    }

    const minute =
      status === "live"
        ? Math.min(Math.floor((now.getTime() - kickoff) / 60000), duration)
        : undefined;

    return {
      id: m.id ?? m.match_id ?? -1, // ✅ always a number
      team1: m.home_team?.name || "TBD",
      team2: m.away_team?.name || "TBD",
      score:
        m.home_score != null && m.away_score != null
          ? `${m.home_score} - ${m.away_score}`
          : "",
      status,
      minute,
      // ✅ fixed: format in local timezone properly
      date: new Date(m.utc_kickoff).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  };

  // NEW: handle delete click
  function handleDeleteClick(id: number) {
    setDeleteMatchId(id);
  }

  // NEW: confirm delete
  async function confirmDelete() {
    if (!deleteMatchId) return;

    try {
      const res = await fetch(`${baseURL}/matches/${deleteMatchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete match");
        return;
      }
      // remove from UI
      setMatches(matches.filter((m) => (m.id ?? m.match_id) !== deleteMatchId));
    } catch (e) {
      console.error("Failed to delete match", e);
      alert("Unexpected error while deleting match");
    } finally {
      setDeleteMatchId(null);
    }
  }

  const handleBack = useCallback(() => {
    if (typeof window === "undefined") {
      navigate("/");
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleAuthRedirect = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  return (
    <div className={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {showAuthModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mymatches-auth-modal-title"
          aria-describedby="mymatches-auth-modal-description"
        >
          <div className={styles.modal}>
            <h2 id="mymatches-auth-modal-title" className={styles.modalTitle}>
              Manage your matches
            </h2>
            <p
              id="mymatches-auth-modal-description"
              className={styles.modalDescription}
            >
              My Matches keeps every fixture you create in one place. Track
              live games and log events, prepare upcoming kickoffs, review past
              results, spin up new matches, or import them in bulk with our CSV
              template. Sign up or log in to start managing your fixtures.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={handleAuthRedirect}
              >
                Sign up / Log in
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Create Matches</h1>
          <p className={styles.heroSubtitle}>
            Spin up new fixtures instantly and manage everything you’ve
            scheduled.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.createButton}
            onClick={() => navigate("/create-match")}
          >
            Create New Match
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          <MatchList
            title="Current Games"
            subtitle="Matches you have in play right now."
            matches={liveMatches.map(transform)}
            accent="live"
            onSeeMore={(id) => navigate(`/live/${id}`)}
          />

          <MatchList
            title="Upcoming Games"
            subtitle="Get everything lined up before kickoff."
            matches={upcomingMatches.map(transform)}
            accent="upcoming"
            onDelete={handleDeleteClick}
            onSeeMore={(id) => navigate(`/create-match/${id}`)} // ✅ correct edit path
          />

          <MatchList
            title="Past Games"
            subtitle="Review final results from the matches you have hosted."
            matches={pastMatches.map(transform)}
            accent="past"
          />
        </div>
      </main>

      {/* NEW: delete confirmation modal */}
      {deleteMatchId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold">Are you sure?</h2>
            <p>This will permanently delete the match.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setDeleteMatchId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMatches;
