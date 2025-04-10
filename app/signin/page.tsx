/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports */
"use client";

import React, { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../firebaseClient";
import { Poppins } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

/**
 * Import the Poppins font from Google.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export default function SignInPage() {
  // Holds the current Firebase user.
  const [user, setUser] = useState<User | null>(null);
  // Shows a spinner while signing in.
  const [loading, setLoading] = useState(false);
  // Wait until Firebase auth state is determined.
  const [initialLoading, setInitialLoading] = useState(true);
  // Error state for sign-in failures.
  const [error, setError] = useState("");
  // Countdown timer when the user is already signed in.
  const [countdown, setCountdown] = useState(5);
  // For redirecting the user.
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function createUserInDB() {
      if (user) {
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL || null,
            }),
          });
          if (!res.ok) {
            throw new Error("Failed to create/update user in DB");
          }
        } catch (err) {
          console.error("Error creating/updating user:", err);
        }
      }
    }
    createUserInDB();
  }, [user]);

  useEffect(() => {
    if (user) {
      const intervalId = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      const timeoutId = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [user, router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error during sign in:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="loader">Loading...</div>
        <style jsx>{`
          .signin-container {
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f7f7f7;
          }
          .loader {
            font-size: 18px;
            color: #555;
          }
        `}</style>
      </div>
    );
  }

  // If user is signed in, show a welcome view with a large green tick overlay.
  if (user) {
    const displayName = user.displayName
      ? user.displayName
      : user.email
      ? user.email.split("@")[0]
      : "User";

    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="signin-card success">
        <FontAwesomeIcon
  icon={faCheckCircle}
  style={{
    color: "rgb(32, 215, 108)",
    fontSize: "6rem",
    fontWeight: 900,
    marginBottom: "1.5rem",
  }}
/>
          <h1>Welcome, {displayName}!</h1>
          <p className="sub-text">You are now signed in.</p>
          <p className="redirect-message">
            Redirecting to the <strong>Home Page</strong> in{" "}
            <span className="countdown">{countdown}</span> seconds...
          </p>
        </div>
        <style jsx>{`
          .signin-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(
                rgba(0, 0, 0, 0.7),
                rgba(0, 0, 0, 0.7)
              ),
              url("/images/phulkari_bagh_hero_cover.png") center/cover no-repeat;
            padding: 0 20px;
          }

            


          .signin-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 2rem 3rem;
            text-align: center;
            max-width: 420px;
            width: 100%;
            position: relative;
          }
          /* Success state styles */
          .success .check-icon faCheckCircle {
            color:rgb(32, 215, 108);
            font-size: 6rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
          }
          .success h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            color: #333;
          }
          .sub-text {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 1rem;
          }
          .redirect-message {
            font-size: 1rem;
            color: #555;
            font-style: italic;
          }
          .countdown {
            color: #2ecc71;
            font-weight: bold;
          }
        `}</style>
      </div>
    );
  }

  // Main sign-in page if user is not signed in, with a background image & overlay.
  return (
    <div className={`${poppins.className} signin-container`}>
      <div className="signin-card">
        <h1>Welcome to Phulkari Bagh</h1>
        <p>Please sign in to continue</p>
        {error && <p className="error-message">{error}</p>}
        <button onClick={handleSignIn} className="signin-button" disabled={loading}>
          {loading ? <span className="loader-spinner" /> : "Sign in with Google"}
        </button>
      </div>
      <style jsx>{`
        .signin-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
              rgba(0, 0, 0, 0.7),
              rgba(0, 0, 0, 0.7)
            ),
            url("/images/phulkari_bagh_cover.png") center/cover no-repeat;
          padding: 0 20px;
        }
        .signin-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          padding: 2rem 3rem;
          text-align: center;
          max-width: 420px;
          width: 100%;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        p {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: #666;
        }
        .error-message {
          color: #e63946;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .signin-button {
          background-color: #4285f4;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease;
          width: 100%;
        }
        .signin-button:hover:not(:disabled) {
          background-color: #357ae8;
          transform: translateY(-2px);
        }
        .signin-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .loader-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid #fff;
          border-top: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
