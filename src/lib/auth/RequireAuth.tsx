import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
    </div>
  );
}

/** Wraps protected routes — redirects to /login once we know for sure
 *  there's no signed-in user (not before; `loading` covers both the
 *  initial auth-state check and, once signed in, the first profile doc
 *  snapshot, so protected pages never render with profile still null). */
export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/** Wraps /login and /signup — signed-in users shouldn't see them. */
export function RedirectIfAuthed() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
