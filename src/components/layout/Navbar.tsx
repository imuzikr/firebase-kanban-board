import { Link, useNavigate } from "react-router-dom";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/lib/types";

export function Navbar({ profile }: { profile: Profile }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="font-semibold text-zinc-900 dark:text-zinc-50">
          수업용 칸반보드
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            {profile.displayName}
            <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {profile.role === "teacher" ? "교사" : "학생"}
            </span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
