import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.AI_BASE_URL && process.env.AI_MODEL);
  return NextResponse.json({
    status: "ok",
    app: "zalam-ai",
    provider: configured ? "CONFIGURED" : "CONFIGURATION_REQUIRED",
    model: configured ? process.env.AI_MODEL : null,
    note: "This endpoint reports configuration only; it does not prove that the provider is reachable."
  });
}
