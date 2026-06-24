import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/app/actions";

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google 로그인이 아직 설정되지 않았습니다.",
  invalid_oauth_state: "Google 로그인 요청이 만료되었거나 올바르지 않습니다.",
  google_401: "Google 인증에 실패했습니다.",
  google_409: "같은 이메일 계정이 있습니다. 기존 방식으로 로그인해 주세요.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/todos");
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card max-w-md">
        <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">TODO LIST</p>
        <h1 className="mt-3 text-3xl font-black">다시 만나 반가워요</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">내 일정과 반복 할 일을 이어서 관리하세요.</p>
        {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{ERROR_MESSAGES[error] ?? "Google 로그인에 실패했습니다."}</p>}
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
