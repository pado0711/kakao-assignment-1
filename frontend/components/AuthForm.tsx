"use client";

import axios from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "./Modal";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.detail ?? "인증 요청에 실패했습니다.";
  return "인증 요청에 실패했습니다.";
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
      ...(mode === "register" ? { name: formData.get("name") } : {}),
    };
    setPending(true);
    try {
      await axios.post(`/api/auth/${mode}`, payload);
      router.replace("/todos");
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <label className="field-label">이름
            <input className="field-input" name="name" autoComplete="name" required />
          </label>
        )}
        <label className="field-label">이메일
          <input className="field-input" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field-label">비밀번호
          <input className="field-input" name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </label>
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />또는<span className="h-px flex-1 bg-slate-200" /></div>
      <a className="btn-secondary flex w-full justify-center" href="/api/auth/google/start">Google로 계속하기</a>
      <p className="mt-5 text-center text-sm text-slate-500">
        {mode === "login" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <Link className="font-semibold text-indigo-600" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "회원가입" : "로그인"}
        </Link>
      </p>
      {error && <Modal message={error} onClose={() => setError("")} />}
    </>
  );
}
