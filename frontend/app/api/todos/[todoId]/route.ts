import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

type Context = { params: Promise<{ todoId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { todoId } = await context.params;
  return proxyRequest(request, `/todos/${todoId}`, "PUT");
}

export async function DELETE(request: NextRequest, context: Context) {
  const { todoId } = await context.params;
  return proxyRequest(request, `/todos/${todoId}`, "DELETE");
}
