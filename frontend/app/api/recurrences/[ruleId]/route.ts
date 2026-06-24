import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

type Context = { params: Promise<{ ruleId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { ruleId } = await context.params;
  return proxyRequest(request, `/recurrences/${ruleId}`, "PUT");
}

export async function DELETE(request: NextRequest, context: Context) {
  const { ruleId } = await context.params;
  return proxyRequest(request, `/recurrences/${ruleId}`, "DELETE");
}
