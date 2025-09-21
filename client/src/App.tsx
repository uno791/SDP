import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import { House } from "./pages/house";
import { Ball } from "./pages/ball";
import DoodleHome from "./pages/liveeplscoreboard";
import { Layout } from "./Layout";
import { UserProvider } from "./Users/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ComicBook from "./components/LoginSignupComp/ComicBook/ComicBook";
import MyMatches from "./pages/MatchPages/MyMatches";
import CreateMatch from "./pages/MatchPages/CreateMatch";
import LiveMatchUpdate from "./pages/MatchPages/LiveMatchUpdate";
import LandingPage from "./pages/LandingPage";
// import the new profile page
import ProfilePage from "./pages/ProfilePage";
import MatchViewer from "./pages/MatchViewer";
import PlayerStats from "./pages/PlayerStats";
import Commentary from "./pages/Commentary";

function App() {
  return (
    <GoogleOAuthProvider clientId="719123023157-8iqvisdfo85e23emcfe7gth9vqa7ebop.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Routes>
            {/* Routes inside Layout will have the NavBar */}
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />

              <Route path="/doodlehome" element={<DoodleHome />} />
              <Route path="/signuppage" element={<ComicBook />} />
              <Route path="/loginpage" element={<ComicBook />} />
              <Route path="/mymatches" element={<MyMatches />} />
              <Route path="create-match" element={<CreateMatch />} />
              <Route path="/live/:id" element={<LiveMatchUpdate />} />

              {/* New Profile route */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/matchviewer" element={<MatchViewer />} />
              <Route path="/playerstats" element={<PlayerStats />} />
              <Route path="/commentary" element={<Commentary />} />

            </Route>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
