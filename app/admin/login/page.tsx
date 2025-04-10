"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// Header Component
function Header() {
  return (
    <header style={headerStyles.container}>
      <div style={headerStyles.logo}>Phulkari Bagh</div>
      <nav style={headerStyles.navLinks}>
        <a href="/" style={headerStyles.link}>Home</a>
        <a href="/shop" style={headerStyles.link}>Shop</a>
        <a href="/about" style={headerStyles.link}>About</a>
        <a href="/contact" style={headerStyles.link}>Contact</a>
      </nav>
    </header>
  );
}

// Footer Component
function Footer() {
  return (
    <footer style={footerStyles.container}>
      <p style={footerStyles.text}>
        &copy; {new Date().getFullYear()} Phulkari Bagh. All rights reserved.
      </p>
      <div style={footerStyles.links}>
        <a href="/privacy" style={footerStyles.link}>Privacy Policy</a>
        <a href="/terms" style={footerStyles.link}>Terms & Conditions</a>
      </div>
    </footer>
  );
}

// Generic Error Modal Component
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <p style={modalStyles.modalMessage}>{message}</p>
        <button onClick={onClose} style={modalStyles.modalButton}>Close</button>
      </div>
    </div>
  );
}

// Offline Modal Component
function OfflineModal({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.modalTitle}>You're Offline</h2>
        <p style={modalStyles.modalMessage}>Please check your internet connection and try again.</p>
        <button onClick={onRetry} style={modalStyles.modalButton}>Retry</button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  // Login form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offline state (true if browser is offline)
  const [isOffline, setIsOffline] = useState(false);
  // Whether to show an error modal (for login errors)
  const [modalError, setModalError] = useState<string | null>(null);

  // Listen for online/offline events.
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setModalError(null);
    setLoading(true);

    // If offline, set an offline error modal.
    if (!navigator.onLine) {
      setModalError("You are offline. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        // Enhance error messaging here by parsing error responses, if needed.
        throw new Error("Invalid credentials");
      }

      // On successful login, redirect to the admin dashboard.
      router.push("/admin");
    } catch (err: any) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main style={styles.container}>
        <div style={styles.loginCard}>
          <h1 style={styles.title}>Admin Login</h1>
          {error && <p style={styles.errorText}>{error}</p>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </main>
      <Footer />

      {/* Show modals for errors */}
      {modalError && <ErrorModal message={modalError} onClose={() => setModalError(null)} />}
      {isOffline && <OfflineModal onRetry={() => window.location.reload()} />}
    </>
  );
}

// Inline styles using a style object.
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 140px)", // leaving space for header and footer
    backgroundColor: "#f9fafb",
    padding: "1rem",
    marginTop: "70px", // header height
    marginBottom: "70px", // footer height (approx.)
  },
  loginCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: "400px",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    marginBottom: "1.5rem",
    fontSize: "1.5rem",
    textAlign: "center",
  },
  errorText: {
    color: "#d90429",
    marginBottom: "1rem",
    fontWeight: 500,
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontWeight: 500,
  },
  input: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    outline: "none",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    transition: "background-color 0.2s",
  },
};

const headerStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#1d4ed8",
    color: "#fff",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 2000,
  },
  logo: {
    fontSize: "1.8rem",
    fontWeight: "bold",
  },
  navLinks: {
    display: "flex",
    gap: "1.5rem",
  },
  link: {
    color: "#fff",
    fontSize: "1rem",
    textDecoration: "none",
    transition: "color 0.3s",
  },
};

const footerStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#005bb5",
    color: "#fff",
    textAlign: "center",
    padding: "1rem",
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
  },
  text: {
    margin: 0,
    fontSize: "0.9rem",
  },
  links: {
    marginTop: "0.5rem",
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  link: {
    color: "#fff",
    textDecoration: "underline",
    transition: "color 0.3s",
  },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto" as "auto",
    position: "relative" as "relative",
  },
  closeButton: {
    position: "absolute" as "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  modalMessage: {
    color: "#d90429",
    textAlign: "center" as "center",
    marginBottom: "1rem",
  },
  modalButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: "1rem",
  },
};

export { headerStyles, footerStyles, modalStyles };