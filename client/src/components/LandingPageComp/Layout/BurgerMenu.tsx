import { useContext } from "react";
import { X } from "lucide-react";
import styles from "./BurgerMenu.module.css";
import { UserContext } from "../../../Users/UserContext";

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "", label: "Home" },
  { id: "favourite", label: "Favourite Teams" },
  { id: "watchalongs", label: "Watchalong Hub" },
  { id: "user-games", label: "User Games" },
  { id: "mymatches", label: "My Matches" },
  { id: "signup", label: "SignUp/LogIn" },
];

type BurgerMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function BurgerMenu({ open, onClose }: BurgerMenuProps) {
  const userContext = useContext(UserContext);
  const user = userContext?.user ?? null;

  const sections = user
    ? SECTIONS.filter((section) => section.id !== "signup")
    : SECTIONS;

  const handleSignOut = () => {
    userContext?.setUser?.(null);
    onClose();
  };

  return (
    <aside className={`${styles.menu} ${open ? styles.open : ""}`}>
      <div className={styles.top}>
        <div className={styles.title}>Menu</div>
        <button onClick={onClose} className={styles.closeButton}>
          <X />
        </button>
      </div>
      <nav className={styles.nav}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`/${s.id}`}
            onClick={onClose}
            className={styles.link}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {user && userContext?.setUser && (
        <button
          type="button"
          onClick={handleSignOut}
          className={styles.signOutButton}
        >
          Sign Out
        </button>
      )}
    </aside>
  );
}
