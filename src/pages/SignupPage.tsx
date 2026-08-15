import { useState, useTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { signUp } from "@/lib/auth/actions";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/email-already-in-use") return "이미 가입된 이메일입니다";
    if (err.code === "auth/weak-password") return "비밀번호는 6자 이상이어야 합니다";
    if (err.code === "auth/invalid-email") return "올바른 이메일 형식이 아닙니다";
  }
  return "가입에 실패했습니다. 다시 시도해주세요.";
}

export function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!displayName) return setError("이름을 입력해주세요");
    if (password.length < 6) return setError("비밀번호는 6자 이상이어야 합니다");

    setError(null);
    startTransition(async () => {
      try {
        await signUp(displayName, email, password);
        navigate("/dashboard");
      } catch (err) {
        setError(friendlyError(err));
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-lg font-bold text-zinc-900 dark:text-zinc-50">회원가입</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">이름</label>
            <input
              name="displayName"
              required
              autoFocus
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">이메일</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">또는</span>
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
        </div>
        <GoogleSignInButton />

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-zinc-900 underline dark:text-zinc-100">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
