import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setCheckingAuth(false);
    });
  }, []);

  if (checkingAuth) {
    return (
      <main className="boot-screen">
        <div className="brand-mark large-mark">AF</div>
        <div className="loader" />
        <p>Connecting to Firebase...</p>
      </main>
    );
  }

  return user ? <Dashboard user={user} /> : <AuthScreen />;
}
