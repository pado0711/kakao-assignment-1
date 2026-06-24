import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getTodos } from "@/app/actions";
import LogoutButton from "@/components/LogoutButton";
import Pagination from "@/components/Pagination";
import TodoControls from "@/components/TodoControls";
import TodoList from "@/components/TodoList";
import { formatDate, getKstDate } from "@/lib/date";
import type { TodoFilter } from "@/types/todo";

const VALID_FILTERS = new Set(["all", "active", "completed"]);

export default async function TodosPage({ searchParams }: {
  searchParams: Promise<{ date?: string; filter?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date! : getKstDate();
  const filter = (VALID_FILTERS.has(params.filter ?? "") ? params.filter : "all") as TodoFilter;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const result = await getTodos({ date, filter, page });
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 md:py-12">
      <section className="card">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">TODO LIST</p>
            <h1 className="mt-2 text-3xl font-black">오늘의 할 일</h1>
            <p className="mt-2 text-sm text-slate-500">{user.name}님, 작은 일부터 차근차근 기록해 보세요.</p>
          </div>
          <LogoutButton />
        </header>
        <TodoControls date={date} filter={filter} />
        <div className="mt-6 flex items-center justify-between">
          <div><p className="font-bold">{formatDate(date)}</p><p className="text-xs text-slate-400">선택 날짜 기준 상태를 표시합니다.</p></div>
          <Link className="btn-primary" href={`/todos/new?date=${date}`}>+ 새 할 일</Link>
        </div>
        <TodoList todos={result.items} />
        <Pagination date={date} filter={filter} currentPage={result.page} totalPages={result.totalPages} />
      </section>
    </main>
  );
}
