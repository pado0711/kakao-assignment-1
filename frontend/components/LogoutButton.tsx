"use client";

import axios from "axios";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button className="text-sm font-semibold text-slate-500 hover:text-slate-900" type="button" onClick={async () => {
      await axios.post("/api/auth/logout").catch(() => undefined);
      router.replace("/login");
      router.refresh();
    }}>로그아웃</button>
  );
}
