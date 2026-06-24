import { render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TodoForm from "@/components/TodoForm";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn(), replace: vi.fn() }),
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
}));

describe("TodoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation feedback for content longer than 50 characters", async () => {
    const user = userEvent.setup();
    render(<TodoForm initial={{ kind: "single", sourceId: 0, content: "", date: "2026-06-24" }} />);
    await user.type(screen.getByLabelText("할 일"), "가".repeat(51));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("할 일은 50자 이내로 입력해 주세요.");
  });

  it("requires a weekday and creates a recurrence after selection", async () => {
    const user = userEvent.setup();
    render(<TodoForm initial={{ kind: "single", sourceId: 0, content: "", date: "2026-06-24" }} />);
    await user.type(screen.getByLabelText("할 일"), "운동");
    await user.click(screen.getByRole("checkbox", { name: "요일마다 반복" }));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("반복할 요일을 하나 이상 선택해 주세요.");
    await user.click(screen.getByRole("button", { name: "확인" }));
    await user.click(screen.getByRole("button", { name: "월" }));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(axios.post).toHaveBeenCalledWith("/api/recurrences", {
      content: "운동",
      startDate: "2026-06-24",
      endDate: null,
      weekdays: [1],
    });
    expect(push).toHaveBeenCalledWith("/todos?date=2026-06-24&filter=all&page=1");
  });
});
