import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;

  try {
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > 100_000) {
      return NextResponse.json(
        { error: "حجم الطلب يتجاوز الحد المسموح (100 KB)." },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 40) {
      return NextResponse.json({ error: "أرسل من 1 إلى 40 رسالة صالحة." }, { status: 400 });
    }

    const messages: ChatMessage[] = [];
    let total = 0;
    for (const item of body.messages) {
      if (!item || !["user", "assistant"].includes(item.role) ||
          typeof item.content !== "string" || !item.content.trim()) {
        return NextResponse.json({ error: "تنسيق الرسائل غير صالح." }, { status: 400 });
      }
      if (item.content.length > 12000) {
        return NextResponse.json({ error: "الرسالة تتجاوز الحد المسموح." }, { status: 413 });
      }
      total += item.content.length;
      messages.push({ role: item.role, content: item.content });
    }
    if (total > 40000) {
      return NextResponse.json({ error: "حجم المحادثة كبير جدًا." }, { status: 413 });
    }

    const baseURL = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;
    if (!baseURL || !model) {
      return NextResponse.json({ error: "اضبط AI_BASE_URL و AI_MODEL على الخادم." }, { status: 503 });
    }

    const client = new OpenAI({
      baseURL,
      apiKey: process.env.AI_API_KEY || "local-no-key",
      timeout: 60000,
      maxRetries: 1
    });
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7
    });
    return NextResponse.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch {
    return NextResponse.json(
      { error: "تعذر إكمال الطلب. تحقق من اتصال مزوّد النموذج وسجلات الخادم." },
      { status: 502 }
    );
  }
}
