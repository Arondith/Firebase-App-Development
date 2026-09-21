import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider } from "../firebase";

type Mode = "signin" | "signup";

function friendlyAuthError(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is disabled in Firebase Authentication.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured for this project yet.";
    case "auth/unauthorized-domain":
      return "This website is not listed as an authorized domain in Firebase Authentication.";
    case "auth/invalid-api-key":
      return "The Firebase API key in the app configuration is invalid.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Firebase temporarily blocked more attempts. Wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      if (error instanceof FirebaseError) {
        return `Firebase error: ${error.code}`;
      }
      return "Could not complete sign-in. Please try again.";
  }
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
      <section className="auth-product">
        <a className="brand" href="/" aria-label="ApplyFlow home">
          <span className="brand-mark">A</span>
          <span>ApplyFlow</span>
        </a>

        <div className="auth-product-copy">
          <span className="product-label">Job search workspace</span>
          <h1>Stop losing track of good opportunities.</h1>
          <p>
            Keep applications, recruiter details, follow-ups and interview
            notes in one place so the next action is always clear.
          </p>

          <ul className="product-points">
            <li>
              <strong>Know what needs attention.</strong>
              <span>See overdue and upcoming follow-ups before they slip.</span>
            </li>
            <li>
              <strong>Keep context with the application.</strong>
              <span>Store contacts, links, documents and interview notes together.</span>
            </li>
            <li>
              <strong>Understand your pipeline.</strong>
              <span>Track progress and interview conversion without a spreadsheet.</span>
            </li>
          </ul>
        </div>

        <p className="auth-footnote">
          Your workspace is private to your signed-in account.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-heading">
            <span>{mode === "signin" ? "Welcome back" : "Create account"}</span>
            <h2>
              {mode === "signin"
                ? "Sign in to ApplyFlow"
                : "Create your workspace"}
            </h2>
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
            <span>or</span>
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
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
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
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
