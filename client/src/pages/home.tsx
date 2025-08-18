import Header from "../components/Header/Header";
import LiveLeagueGames from "../components/LiveLeagueGames/LiveLeagueGames";
import PastLeagueGames from "../components/PastLeagueGames/PastLeagueGames";
import LeagueTable from "../components/LeagueTable/LeagueTable";
import LatestNews from "../components/LastestNews/LastestNews";
import LiveStreamsCTA from "../components/LiveStreamsCTA/LiveStreamsCTA";
import Footer from "../components/Footer/Footer";
import "./Home.css";

export default function Home() {
  return (
    <>
      <main className="page">
        <div className="container">
          <section className="colMain">
            <LiveLeagueGames />
            <PastLeagueGames />
            <LiveStreamsCTA />
          </section>

          <aside className="colSide">
            <LeagueTable rows={[]} />
            <LatestNews />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
