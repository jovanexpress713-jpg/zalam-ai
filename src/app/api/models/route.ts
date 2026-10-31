import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  const baseURL = process.env.AI_BASE_URL;
  if (!baseURL) {
    return NextResponse.json({ status: "CONFIGURATION_REQUIRED", models: [] }, { status: 503 });
  }
  try {
    const client = new OpenAI({ baseURL, apiKey: process.env.AI_API_KEY || "local-no-key" });
    const result = await client.models.list();
    return NextResponse.json({ status: "CONNECTED", models: result.data.map(m => ({ id: m.id, owned_by: m.owned_by })) });
  } catch {
    return NextResponse.json({ status: "PROVIDER_UNAVAILABLE", models: [] }, { status: 502 });
  }
}
