"use server";

import { BackendError, backendFetch } from "@/lib/backend";
import type { RecurrenceRule, TodoPage, TodoOccurrence, User } from "@/types/todo";

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await backendFetch<User>("/auth/me");
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) return null;
    throw error;
  }
}

export async function getTodos(params: {
  date: string;
  filter: string;
  page: number;
}): Promise<TodoPage> {
  const query = new URLSearchParams({
    date: params.date,
    filter: params.filter,
    page: String(params.page),
    pageSize: "6",
  });
  return backendFetch<TodoPage>(`/todos?${query}`);
}

export async function getTodo(id: number): Promise<TodoOccurrence> {
  return backendFetch<TodoOccurrence>(`/todos/${id}`);
}

export async function getRecurrence(id: number): Promise<RecurrenceRule> {
  return backendFetch<RecurrenceRule>(`/recurrences/${id}`);
}
