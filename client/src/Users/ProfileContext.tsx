// src/Users/ProfileContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../config";
import { useUser } from "./UserContext";

export type Profile = {
  postalCode: string;
  phone: string;
  image: string | null;
  sellerStatus: "none" | "pending" | "approved";
};

type ProfileContextType = {
  profile: Profile;
  refreshProfile: () => Promise<void>;
};

const defaultProfile: Profile = {
  postalCode: "-",
  phone: "",
  image: null,
  sellerStatus: "none",
};

const ProfileContext = createContext<ProfileContextType>({
  profile: defaultProfile,
  refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  // Determine whether this user is a seller, and if so whether they're approved
  const determineSellerStatus = async (
    username: string
  ): Promise<"none" | "pending" | "approved"> => {
    try {
      const res = await axios.get(`${baseURL}/artisan/${username}`);
      return res.data.verified === 1 ? "approved" : "pending";
    } catch {
      return "none";
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user?.username) return;
    const cacheKey = `profileData:${user.username}`;

    try {
      // always fetch fresh data
      const res = await axios.get(`${baseURL}/getuser/${user.username}`);
      const fresh: Profile = {
        postalCode: res.data.postal_code?.toString() || "-",
        phone: res.data.phone_no || "",
        image: res.data.user_pfp || null,
        sellerStatus: await determineSellerStatus(user.username),
      };

      // update state
      setProfile(fresh);

      // re‐cache for possible future use
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: fresh, savedAt: Date.now() })
      );
    } catch (err) {
      console.error("❌ Failed to load profile:", err);
    }
  };

  // On mount (or whenever user changes), fetch the profile
  useEffect(() => {
    if (user?.username) {
      refreshProfile();
    }
  }, [user?.username]);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => useContext(ProfileContext);
