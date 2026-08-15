import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// These are the public, client-side Firebase config values — safe to ship
// in the bundle (Firestore Security Rules are the real access control, not
// secrecy of this config). Fill in your own real project's values in
// .env — see .env.example and README.md's setup section.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "demo-kanban-board.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "demo-kanban-board",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Opt-in only — the Firebase Local Emulator Suite's Firestore emulator
// requires a Java runtime, which isn't a given on every machine. Default
// is a real Firebase project (via the .env values above). Set
// VITE_USE_FIREBASE_EMULATOR=true if you do have Java installed and want
// the emulator instead. Only ever wired up in dev builds.
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
