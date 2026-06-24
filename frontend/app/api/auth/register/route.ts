import { NextRequest } from "next/server";
import { authRequest } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  return authRequest(request, "/auth/register");
}
