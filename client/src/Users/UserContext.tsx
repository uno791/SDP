"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { User } from "../Users/User";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  username: string;
  setUsername: (username: string) => void;
}

export type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  storage?: StorageAdapter | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  initialUser,
  storage,
}) => {
  const storageRef = useRef<StorageAdapter | null>(
    storage ?? (typeof window !== "undefined" ? window.localStorage : null)
  );

  const readStoredUser = useCallback((): User | null => {
    const store = storageRef.current;
    if (!store) return null;

    const raw = store.getItem("user");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return new User(parsed);
    } catch (err) {
      console.error("Failed to parse stored user", err);
      return null;
    }
  }, []);

  const initial =
    initialUser !== undefined ? initialUser : readStoredUser();

  const [user, setUserState] = useState<User | null>(initial);
  const [username, setUsername] = useState<string>(initial?.username ?? "");

  useEffect(() => {
    if (initialUser !== undefined) return;
    const stored = readStoredUser();
    if (stored) {
      setUserState(stored);
      setUsername(stored.username ?? "");
    }
  }, [initialUser, readStoredUser]);

  const setUser = (next: User | null) => {
    const store = storageRef.current;
    if (next) {
      if (store) {
        try {
          store.setItem("user", JSON.stringify(next));
        } catch (err) {
          console.error("Failed to persist user", err);
        }
      }
      setUsername(next.username || "No Username");
    } else {
      if (store) {
        try {
          store.removeItem("user");
        } catch (err) {
          console.error("Failed to clear user", err);
        }
      }
      setUsername("");
    }

    setUserState(next);
  };

  return (
    <UserContext.Provider value={{ user, setUser, username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
