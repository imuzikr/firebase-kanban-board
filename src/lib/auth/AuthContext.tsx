import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Profile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  /** True while either the auth state or (once signed in) the profile
   *  doc's first snapshot hasn't arrived yet. */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setProfile(null);
        setProfileLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    return onSnapshot(doc(db, "profiles", user.uid), (snap) => {
      setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as Profile) : null);
      setProfileLoading(false);
    });
  }, [user]);

  const loading = authLoading || (user !== null && profileLoading);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
