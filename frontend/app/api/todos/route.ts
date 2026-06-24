import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  return proxyRequest(request, "/todos", "POST");
}
