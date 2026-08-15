import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navbar } from "./Navbar";

/** Wraps every route behind RequireAuth. By the time this renders,
 *  RequireAuth has already waited out the initial profile snapshot, so
 *  `profile` should be set — the null fallback here is only a defensive
 *  guard (e.g. a profile doc that failed to get created) rather than an
 *  expected steady state. */
export function AppLayout() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-center text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        프로필을 불러올 수 없습니다. 다시 로그인해주세요.
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar profile={profile} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
