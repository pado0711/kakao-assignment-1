import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/app/actions";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/todos");
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card max-w-md">
        <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">TODO LIST</p>
        <h1 className="mt-3 text-3xl font-black">다시 만나 반가워요</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">내 일정과 반복 할 일을 이어서 관리하세요.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
