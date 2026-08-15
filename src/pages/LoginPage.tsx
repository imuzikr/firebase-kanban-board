import { useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { signIn } from "@/lib/auth/actions";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
      return "이메일 또는 비밀번호가 올바르지 않습니다";
    }
    if (err.code === "auth/invalid-email") return "올바른 이메일 형식이 아닙니다";
  }
  return "로그인에 실패했습니다. 다시 시도해주세요.";
}

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setError(null);
    startTransition(async () => {
      try {
        await signIn(email, password);
        navigate("/dashboard");
      } catch (err) {
        setError(friendlyError(err));
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-lg font-bold text-zinc-900 dark:text-zinc-50">로그인</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">이메일</label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">또는</span>
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
        </div>
        <GoogleSignInButton />

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="text-zinc-900 underline dark:text-zinc-100">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
