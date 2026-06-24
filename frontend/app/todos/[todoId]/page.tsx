import { notFound, redirect } from "next/navigation";
import { BackendError } from "@/lib/backend";
import { getCurrentUser, getRecurrence, getTodo } from "@/app/actions";
import TodoForm from "@/components/TodoForm";

export default async function EditTodoPage({ params }: { params: Promise<{ todoId: string }> }) {
  if (!await getCurrentUser()) redirect("/login");
  const { todoId } = await params;
  const [kind, idValue, occurrenceDate] = decodeURIComponent(todoId).split(":");
  const sourceId = Number.parseInt(idValue, 10);
  if (!Number.isInteger(sourceId) || !["single", "recurring"].includes(kind)) notFound();
  try {
    let initial;
    if (kind === "single") {
      initial = await getTodo(sourceId);
    } else {
      const recurrence = await getRecurrence(sourceId);
      initial = { kind: "recurring" as const, sourceId, content: recurrence.content, date: occurrenceDate, recurrence };
    }
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8 md:py-12">
        <section className="card">
          <p className="text-xs font-bold tracking-[0.25em] text-indigo-600">EDIT TODO</p>
          <h1 className="mb-7 mt-2 text-3xl font-black">할 일 수정</h1>
          <TodoForm mode="edit" initial={initial} />
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    throw error;
  }
}
