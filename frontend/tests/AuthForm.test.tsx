import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthForm from "@/components/AuthForm";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with an email and password without offering Google login", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    expect(screen.queryByRole("link", { name: /Google/ })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(axios.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "user@example.com",
      password: "password123",
    });
    expect(replace).toHaveBeenCalledWith("/todos");
    expect(refresh).toHaveBeenCalled();
  });
});
