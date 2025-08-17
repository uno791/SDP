import { Link } from "react-router-dom";

export function NavBar() {
  return (
    <div>
      <Link to="/">
        <button>Home</button>
      </Link>
      <Link to="/house">
        <button>House</button>
      </Link>
      <Link to="/ball">
        <button>Ball</button>
      </Link>
      <Link to="/doodlehome">
        <button>Doodle Home</button>
      </Link>
    </div>
  );
}
