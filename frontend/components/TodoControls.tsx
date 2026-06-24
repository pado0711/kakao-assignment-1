"use client";

import { useRouter } from "next/navigation";
import { shiftDate } from "@/lib/date";
import type { TodoFilter } from "@/types/todo";

const filters: Array<{ value: TodoFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
];

export default function TodoControls({ date, filter }: { date: string; filter: TodoFilter }) {
  const router = useRouter();
  const move = (nextDate: string, nextFilter = filter) => {
    router.push(`/todos?date=${nextDate}&filter=${nextFilter}&page=1`);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-2">
        <button className="btn-ghost" type="button" aria-label="이전 날짜" onClick={() => move(shiftDate(date, -1))}>←</button>
        <input className="rounded-xl bg-transparent px-3 py-2 text-center font-semibold" aria-label="날짜" type="date" value={date} onChange={(event) => move(event.target.value)} />
        <button className="btn-ghost" type="button" aria-label="다음 날짜" onClick={() => move(shiftDate(date, 1))}>→</button>
      </div>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="상태 필터">
        {filters.map((item) => (
          <button key={item.value} className={item.value === filter ? "tab-active" : "tab"} role="tab" aria-selected={item.value === filter} type="button" onClick={() => move(date, item.value)}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}
