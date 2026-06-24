import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/app/actions";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/todos");
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card max-w-md">
        <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">TODO LIST</p>
        <h1 className="mt-3 text-3xl font-black">새로운 시작</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">계정을 만들고 어디서든 일정을 확인하세요.</p>
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
