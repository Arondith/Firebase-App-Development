import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

type Mode = "signin" | "signup";

function friendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  if (error.message.includes("auth/invalid-credential")) {
    return "The email or password is incorrect.";
  }

  if (error.message.includes("auth/email-already-in-use")) {
    return "That email is already registered.";
  }

  if (error.message.includes("auth/weak-password")) {
    return "Use a stronger password with at least 6 characters.";
  }

  if (error.message.includes("auth/popup-closed-by-user")) {
    return "Google sign-in was closed before it finished.";
  }

  return "Could not complete sign-in. Check your Firebase Auth setup and try again.";
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (displayName.trim()) {
          await updateProfile(credential.user, {
            displayName: displayName.trim(),
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (caughtError) {
      setError(friendlyAuthError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setError("");
    setBusy(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (caughtError) {
      setError(friendlyAuthError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <a className="brand" href="/" aria-label="ApplyFlow home">
          <span className="brand-mark">AF</span>
          <span>ApplyFlow</span>
        </a>

        <div className="auth-copy">
          <p className="eyebrow">Firebase portfolio project</p>
          <h1>Turn job hunting into a trackable workflow.</h1>
          <p>
            A real-time application command center built with React,
            TypeScript, Firebase Authentication, Cloud Firestore and Storage.
          </p>

          <div className="auth-feature-grid">
            <article>
              <strong>Live sync</strong>
              <span>Firestore updates every signed-in session in real time.</span>
            </article>
            <article>
              <strong>Cloud files</strong>
              <span>Attach resumes, cover letters and supporting documents.</span>
            </article>
            <article>
              <strong>Secure by user</strong>
              <span>Firestore and Storage rules isolate each account.</span>
            </article>
          </div>
        </div>

        <p className="auth-footnote">
          Built as a production-style Firebase showcase, not a static UI demo.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div>
            <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Create account"}</p>
            <h2>{mode === "signin" ? "Sign in to your workspace" : "Start tracking applications"}</h2>
          </div>

          <button
            className="button google-button"
            type="button"
            onClick={handleGoogleAuth}
            disabled={busy}
          >
            <span className="google-dot">G</span>
            Continue with Google
          </button>

          <div className="divider">
            <span>or use email</span>
          </div>

          <form className="auth-form" onSubmit={handleEmailAuth}>
            {mode === "signup" && (
              <label>
                Name
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="button primary-button" disabled={busy}>
              {busy
                ? "Working..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <button
            className="text-button"
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
            }}
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
