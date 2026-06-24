"use client";

import axios from "axios";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import type { RecurrenceSummary } from "@/types/todo";

const WEEKDAYS = [
  { value: 1, label: "월" }, { value: 2, label: "화" }, { value: 3, label: "수" },
  { value: 4, label: "목" }, { value: 5, label: "금" }, { value: 6, label: "토" },
  { value: 7, label: "일" },
];

interface TodoFormProps {
  mode?: "create" | "edit";
  initial?: {
    kind: "single" | "recurring";
    sourceId: number;
    content: string;
    date: string;
    recurrence?: RecurrenceSummary;
  };
}

function getError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) return detail[0]?.msg ?? "입력값을 확인해 주세요.";
    return detail ?? (error.response?.status === 401 ? "로그인이 만료되었습니다." : "요청을 처리하지 못했습니다.");
  }
  return "요청을 처리하지 못했습니다.";
}

export default function TodoForm({ mode = "create", initial }: TodoFormProps) {
  const router = useRouter();
  const recurrence = initial?.recurrence;
  const [content, setContent] = useState(initial?.content ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [repeating, setRepeating] = useState(initial?.kind === "recurring");
  const [weekdays, setWeekdays] = useState<number[]>(recurrence?.weekdays ?? []);
  const [useEndDate, setUseEndDate] = useState(Boolean(recurrence?.endDate));
  const [endDate, setEndDate] = useState(recurrence?.endDate ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showScope, setShowScope] = useState(false);

  function validate(): string | null {
    if (!content.trim()) return "할 일을 입력해 주세요.";
    if (content.trim().length > 50) return "할 일은 50자 이내로 입력해 주세요.";
    if (!date) return "날짜를 선택해 주세요.";
    if (repeating && weekdays.length === 0) return "반복할 요일을 하나 이상 선택해 주세요.";
    if (repeating && useEndDate && (!endDate || endDate < date)) return "종료일은 시작일보다 빠를 수 없습니다.";
    return null;
  }

  async function save(scope?: "occurrence" | "series") {
    const validation = validate();
    if (validation) { setError(validation); return; }
    setPending(true);
    try {
      if (mode === "create") {
        if (repeating) {
          await axios.post("/api/recurrences", { content, startDate: date, endDate: useEndDate ? endDate : null, weekdays });
        } else {
          await axios.post("/api/todos", { content, date });
        }
      } else if (initial?.kind === "single") {
        await axios.put(`/api/todos/${initial.sourceId}`, { content });
      } else if (initial) {
        if (scope === "series") {
          await axios.put(`/api/recurrences/${initial.sourceId}`, {
            content, startDate: date, endDate: useEndDate ? endDate : null,
            endDateSet: true, weekdays,
          });
        } else {
          await axios.put(`/api/recurrences/${initial.sourceId}/occurrences/${initial.date}`, { content });
        }
      }
      router.push(`/todos?date=${date}&filter=all&page=1`);
      router.refresh();
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.replace("/login");
        return;
      }
      setError(getError(requestError));
    } finally {
      setPending(false);
      setShowScope(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "edit" && initial?.kind === "recurring") {
      const validation = validate();
      if (validation) { setError(validation); return; }
      setShowScope(true);
      return;
    }
    await save();
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) => current.includes(value)
      ? current.filter((weekday) => weekday !== value)
      : [...current, value].sort());
  }

  return (
    <>
      <form className="space-y-5" onSubmit={submit}>
        <label className="field-label">할 일
          <textarea className="field-input min-h-28 resize-none" aria-label="할 일" value={content} onChange={(event) => setContent(event.target.value)} placeholder="작은 일부터 기록해 보세요" />
          <span className="self-end text-xs font-normal text-slate-400">{content.length}/50</span>
        </label>
        <label className="field-label">{repeating ? "시작일" : "날짜"}
          <input className="field-input" type="date" value={date} disabled={mode === "edit" && initial?.kind === "single"} onChange={(event) => setDate(event.target.value)} required />
        </label>
        {mode === "create" && (
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-semibold text-slate-700">
            <input type="checkbox" checked={repeating} onChange={(event) => setRepeating(event.target.checked)} />요일마다 반복
          </label>
        )}
        {repeating && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-700">반복 요일</legend>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(({ value, label }) => (
                <button key={value} className={weekdays.includes(value) ? "weekday-active" : "weekday"} type="button" aria-pressed={weekdays.includes(value)} onClick={() => toggleWeekday(value)}>{label}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={useEndDate} onChange={(event) => setUseEndDate(event.target.checked)} />종료일 설정
            </label>
            {useEndDate && <input className="field-input" aria-label="반복 종료일" type="date" min={date} value={endDate} onChange={(event) => setEndDate(event.target.value)} />}
          </fieldset>
        )}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" type="button" onClick={() => router.back()}>취소</button>
          <button className="btn-primary flex-1" type="submit" disabled={pending}>{pending ? "저장 중..." : "저장"}</button>
        </div>
      </form>
      {error && <Modal message={error} onClose={() => setError("")} />}
      {showScope && (
        <Modal title="반복 일정 수정" message="어느 범위에 변경사항을 적용할까요?" onClose={() => setShowScope(false)}>
          <button className="btn-secondary" type="button" onClick={() => save("occurrence")}>이번 일정</button>
          <button className="btn-primary" type="button" onClick={() => save("series")}>전체 반복</button>
        </Modal>
      )}
    </>
  );
}
