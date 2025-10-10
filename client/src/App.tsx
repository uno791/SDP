import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import { House } from "./pages/house";
import { Ball } from "./pages/ball";
import DoodleHome from "./pages/liveeplscoreboard";
import { Layout } from "./Layout";
import { UserProvider } from "./Users/UserContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyMatches from "./pages/MatchPages/MyMatches";
import CreateMatch from "./pages/MatchPages/CreateMatch";
import LiveMatchUpdate from "./pages/MatchPages/LiveMatchUpdate";
import LandingPage from "./pages/LandingPage";
import UserGamesPage from "./pages/UserGamesPage";
// import the new profile page
import ProfilePage from "./pages/ProfilePage";
import MatchViewer from "./pages/MatchViewer";
import FavouritesPage from "./pages/FavouritesPage";

import PlayerStats from "./pages/PlayerStats";
import Commentary from "./pages/Commentary";
import Watchalongs from "./pages/Watchalongs";
import FPLPage from "./pages/FPLPage";

function App() {
  return (
    <GoogleOAuthProvider clientId="719123023157-8iqvisdfo85e23emcfe7gth9vqa7ebop.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Routes>
            {/* Routes inside Layout will have the NavBar */}
            <Route element={<Layout />}>
              <Route path="/oldhome" element={<Home />} />
              <Route path="/doodlehome" element={<DoodleHome />} />
              <Route path="/mymatches" element={<MyMatches />} />
              <Route path="create-match" element={<CreateMatch />} />
              <Route path="/edit-match/:id" element={<CreateMatch />} />{" "}
              {/* ✅ new route */}
              <Route path="/create-match/:id" element={<CreateMatch />} />{" "}
              {/* <-- add this */}
              <Route path="/live/:id" element={<LiveMatchUpdate />} />
              <Route path="/favourite" element={<FavouritesPage />} />
              <Route path="/user-games" element={<UserGamesPage />} />
              {/* New Profile route */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/watchalongs" element={<Watchalongs />} />
            </Route>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/matchviewer" element={<MatchViewer />} />
            <Route path="/playerstats" element={<PlayerStats />} />
            <Route path="/commentary" element={<Commentary />} />
            <Route path="/fpl" element={<FPLPage />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
