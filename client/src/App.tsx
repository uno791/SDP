import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/home";
import { House } from "./pages/house";
import { Ball } from "./pages/ball";
import DoodleHome from "./pages/liveeplscoreboard";
import { Layout } from "./Layout";
function App() {
  return (
    <Router>
      <Routes>
        // put within here if you want it to have NavBar
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/house" element={<House />} />
          <Route path="/ball" element={<Ball />} />
          <Route path="/doodlehome" element={<DoodleHome />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
