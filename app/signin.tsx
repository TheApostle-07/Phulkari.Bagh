// pages/signin.tsx
"use client";

import React, { useEffect, useState } from "react";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "./firebaseClient";
import { Poppins } from "next/font/google";

// Import the Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export default function SignInPage() {
  // State for the current Firebase user
  const [user, setUser] = useState<User | null>(null);
  // State to show spinner during sign-in action
  const [loading, setLoading] = useState(false);
  // State to wait until Firebase Auth state is determined
  const [initialLoading, setInitialLoading] = useState(true);
  // Error state for sign-in failures
  const [error, setError] = useState("");

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handler for Google sign in
  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // Firebase automatically updates the user state via onAuthStateChanged
    } catch (err) {
      console.error("Error during sign in:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Display a full-page loader while initial auth state is loading
  if (initialLoading) {
    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="loader">Loading...</div>
        <style jsx>{`
          .signin-container {
            width: 100vw;
            overflow-x: hidden;
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

  // If the user is already signed in, display a friendly welcome message
  if (user) {
    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="signin-card">
          <h1>Welcome, {user.email}!</h1>
          <p>You are now signed in.</p>
        </div>
        <style jsx>{`
          .signin-container {
            width: 100vw;
            overflow-x: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f7f7f7;
          }
          .signin-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 2rem 3rem;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #333;
          }
          p {
            font-size: 1.1rem;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  // Main Sign-In Page for users not signed in
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
          overflow-x: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #e0f7fa 0%, #80deea 100%);
          padding: 0 20px;
        }
        .signin-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          padding: 2rem 3rem;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        h1 {
          font-size: 2.5rem;
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
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}