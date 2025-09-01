"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../Users/User";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  username: string;
  setUsername: (username: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<User | null>(null);
  const [username, setUsername] = useState("");

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserState(new User(parsed)); // Instantiate User class
      setUsername(parsed.username);
    }
  }, []);

  const setUser = (user: User | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setUsername(user?.username || "No Username");
    } else {
      localStorage.removeItem("user");
      setUsername("");
    }
    setUserState(user);
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
