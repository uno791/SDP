import LiveLeagueGames from "../components/HomePageComp/LiveLeagueGames/LiveLeagueGames";
import PastLeagueGames from "../components/HomePageComp/PastLeagueGames/PastLeagueGames";
import LeagueTable from "../components/HomePageComp/LeagueTable/LeagueTable";
import LatestNews from "../components/HomePageComp/LastestNews/LastestNews";
import LiveStreamsCTA from "../components/HomePageComp/LiveStreamsCTA/LiveStreamsCTA";
import Footer from "../components/HomePageComp/Footer/Footer";
import TopPerformersCard from "../components/HomePageComp/TopPerformersCard/TopPerformersCard";
import "./home.css";

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
            {/* ✅ removed rows={[]} */}
            <LeagueTable />
            <LatestNews />
            <TopPerformersCard />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
