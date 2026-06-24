import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import TodoForm from "@/components/TodoForm";
import { getKstDate } from "@/lib/date";

export default async function NewTodoPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  if (!await getCurrentUser()) redirect("/login");
  const { date } = await searchParams;
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : getKstDate();
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-8 md:py-12">
      <section className="card">
        <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">NEW TODO</p>
        <h1 className="mb-7 mt-2 text-3xl font-black">할 일 추가</h1>
        <TodoForm initial={{ kind: "single", sourceId: 0, content: "", date: initialDate }} />
      </section>
    </main>
  );
}
