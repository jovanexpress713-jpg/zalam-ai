import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }
    const baseURL = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;
    if (!baseURL || !model) {
      return NextResponse.json({ error: "CONFIGURATION REQUIRED: set AI_BASE_URL and AI_MODEL on the server" }, { status: 503 });
    }
    const client = new OpenAI({
      baseURL,
      apiKey: process.env.AI_API_KEY || "local-no-key"
    });
    const messages = body.messages.map((m: { role: string; content: string }) => {
      if (!["user", "assistant"].includes(m.role) || typeof m.content !== "string") {
        throw new Error("Invalid message format");
      }
      return { role: m.role as "user" | "assistant", content: m.content.slice(0, 12000) };
    });
    const completion = await client.chat.completions.create({ model, messages, temperature: 0.7 });
    return NextResponse.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
