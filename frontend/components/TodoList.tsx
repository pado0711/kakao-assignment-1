"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "./Modal";
import type { TodoOccurrence } from "@/types/todo";

function endpoint(todo: TodoOccurrence): string {
  return todo.kind === "single"
    ? `/api/todos/${todo.sourceId}`
    : `/api/recurrences/${todo.sourceId}/occurrences/${todo.date}`;
}

export default function TodoList({ todos }: { todos: TodoOccurrence[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TodoOccurrence | null>(null);

  async function mutate(action: () => Promise<unknown>) {
    try {
      await action();
      router.refresh();
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.replace("/login");
        return;
      }
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.detail ?? "요청을 처리하지 못했습니다." : "요청을 처리하지 못했습니다.");
    }
  }

  async function remove(todo: TodoOccurrence, scope: "occurrence" | "series") {
    const url = todo.kind === "single" || scope === "occurrence"
      ? endpoint(todo)
      : `/api/recurrences/${todo.sourceId}`;
    await mutate(() => axios.delete(url));
    setDeleteTarget(null);
  }

  if (todos.length === 0) return <p className="empty-state">해당 조건의 할 일이 없습니다.</p>;

  return (
    <>
      <ul className="mt-5 space-y-3">
        {todos.map((todo) => (
          <li key={todo.key} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm">
            <input type="checkbox" className="size-5 accent-indigo-600" aria-label={`${todo.content} 완료 처리`} checked={todo.status === "completed"} onChange={() => mutate(() => axios.put(endpoint(todo), { status: todo.status === "completed" ? "inProgress" : "completed" }))} />
            <div className="min-w-0 flex-1">
              <p className={todo.status === "completed" ? "truncate text-slate-400 line-through" : "truncate font-medium text-slate-800"}>{todo.content}</p>
              {todo.kind === "recurring" && <p className="mt-1 text-xs font-semibold text-indigo-500">반복 일정</p>}
            </div>
            <Link className="btn-ghost text-sm" href={`/todos/${encodeURIComponent(`${todo.kind}:${todo.sourceId}:${todo.date}`)}`}>수정</Link>
            <button className="btn-ghost text-sm text-rose-500" type="button" onClick={() => {
              if (todo.kind === "single") {
                if (window.confirm("이 할 일을 삭제할까요?")) remove(todo, "occurrence");
              } else setDeleteTarget(todo);
            }}>삭제</button>
          </li>
        ))}
      </ul>
      {deleteTarget && (
        <Modal title="반복 일정 삭제" message="어느 범위의 일정을 삭제할까요?" onClose={() => setDeleteTarget(null)}>
          <button className="btn-secondary" type="button" onClick={() => remove(deleteTarget, "occurrence")}>이번 일정</button>
          <button className="btn-danger" type="button" onClick={() => remove(deleteTarget, "series")}>전체 반복</button>
        </Modal>
      )}
      {error && <Modal message={error} onClose={() => setError("")} />}
    </>
  );
}
