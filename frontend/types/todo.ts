export type TodoStatus = "default" | "inProgress" | "completed";
export type TodoFilter = "all" | "active" | "completed";

export interface RecurrenceSummary {
  weekdays: number[];
  startDate: string;
  endDate: string | null;
}

export interface TodoOccurrence {
  key: string;
  kind: "single" | "recurring";
  sourceId: number;
  content: string;
  date: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
  recurrence?: RecurrenceSummary;
}

export interface TodoPage {
  items: TodoOccurrence[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface RecurrenceRule extends RecurrenceSummary {
  id: number;
  content: string;
}
