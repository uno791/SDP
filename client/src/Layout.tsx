import { NavBar } from "./components/NavBar";
import { Outlet } from "react-router-dom";
export function Layout() {
  return (
    <div>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
