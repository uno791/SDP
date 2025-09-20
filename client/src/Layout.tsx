import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/LandingPageComp/Layout/Header";
import BurgerMenu from "./components/LandingPageComp/Layout/BurgerMenu";

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header onOpenMenu={() => setMenuOpen(true)} />
      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main style={{ paddingTop: "4rem" }}>
        <Outlet />
      </main>
    </>
  );
}
