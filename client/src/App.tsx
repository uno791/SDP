import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { House } from "./pages/house";
import { Ball } from "./pages/ball";
import DoodleHome from "./pages/liveeplscoreboard";
import { Layout } from "./Layout";
import SignUpPage from "./pages/SignUpPage";
import { UserProvider } from "./Users/UserContext"; // <-- add this
import { GoogleOAuthProvider } from "@react-oauth/google"; // <-- add this
function App() {
  return (
  <GoogleOAuthProvider clientId="719123023157-2l972akc1n9ktkksvlhajau4s9aclcng.apps.googleusercontent.com">
    <UserProvider>
      <Router>
        <Routes>
          // put within here if you want it to have NavBar
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/house" element={<House />} />
            <Route path="/ball" element={<Ball />} />
            <Route path="/doodlehome" element={<DoodleHome />} />
            <Route path="/signuppage" element={<SignUpPage />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  </GoogleOAuthProvider>
  );
}

export default App;
