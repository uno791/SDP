import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User } from "../../../Users/User";
import { useUser } from "../../../Users/UserContext";
import { baseURL } from "../../../config";
import { FcGoogle } from "react-icons/fc";
import styles from "../Auth/AuthPanel.module.css";

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}

const GoogleLogInButton: React.FC = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // fetch Google profile
        const { data: userData } = await axios.get<GoogleUserInfo>(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const userId = userData.sub;

        // check if user exists in DB
        const res = await axios.get<{ exists: boolean; username?: string }>(
          `${baseURL}/checkID`,
          { params: { user_id: userId } }
        );

        if (!res.data.exists) {
          setErrorMessage("No account found. Please sign up first.");
          return;
        }

        // create new User instance and store in context
        const newUser = new User({
          id: userId,
          username: res.data.username || userData.name || "Unnamed",
        });

        setUser(newUser);
        navigate("/");
      } catch (err) {
        console.error("❌ Failed to log in:", err);
        setErrorMessage("Google login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
      setErrorMessage("Google login failed. Please try again.");
    },
  });

  return (
    <>
      <button
        className={styles.googleBtn}
        type="button"
        onClick={() => login()}
      >
        <FcGoogle className={styles.googleIcon} />
        LOGIN WITH GOOGLE
      </button>

      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
    </>
  );
};

export default GoogleLogInButton;
