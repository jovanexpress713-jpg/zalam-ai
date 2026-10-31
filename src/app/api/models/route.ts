import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAppAccess(request);
  if (denied) return denied;

  const baseURL = process.env.AI_BASE_URL;
  if (!baseURL) {
    return NextResponse.json({ status: "CONFIGURATION_REQUIRED", models: [] }, { status: 503 });
  }
  try {
    const client = new OpenAI({ baseURL, apiKey: process.env.AI_API_KEY || "local-no-key", timeout: 10000, maxRetries: 0 });
    const result = await client.models.list();
    return NextResponse.json({ status: "CONNECTED", models: result.data.map(m => ({ id: m.id, owned_by: m.owned_by })) });
  } catch {
    return NextResponse.json({ status: "PROVIDER_UNAVAILABLE", models: [] }, { status: 502 });
  }
}
