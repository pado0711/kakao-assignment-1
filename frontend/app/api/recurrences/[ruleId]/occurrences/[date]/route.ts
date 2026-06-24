import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

type Context = { params: Promise<{ ruleId: string; date: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { ruleId, date } = await context.params;
  return proxyRequest(request, `/recurrences/${ruleId}/occurrences/${date}`, "PUT");
}

export async function DELETE(request: NextRequest, context: Context) {
  const { ruleId, date } = await context.params;
  return proxyRequest(request, `/recurrences/${ruleId}/occurrences/${date}`, "DELETE");
}
