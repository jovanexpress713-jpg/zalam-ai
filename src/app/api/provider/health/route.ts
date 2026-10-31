import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;
  const base = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!base || !model) return NextResponse.json({ state: "CONFIGURATION_REQUIRED", reachable: false, error: "اضبط AI_BASE_URL و AI_MODEL على الخادم." }, { status: 503 });
  let endpoint: URL;
  try {
    endpoint = new URL(base);
    if (!["http:", "https:"].includes(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error("invalid");
  } catch {
    return NextResponse.json({ state: "INVALID_CONFIGURATION", reachable: false, error: "عنوان مزوّد النموذج غير صالح." }, { status: 500 });
  }
  const basePath = endpoint.pathname.replace(/\/$/, "");
  endpoint.pathname = `${basePath}/models`.replace(/\/models\/models$/, "/models");
  endpoint.search = "";
  endpoint.hash = "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(endpoint, { headers: process.env.AI_API_KEY ? { Authorization: `Bearer ${process.env.AI_API_KEY}` } : {}, signal: controller.signal, cache: "no-store" });
    return NextResponse.json({
      state: response.ok ? "REACHABLE" : "PROVIDER_ERROR",
      reachable: response.ok,
      configuredModel: model,
      modelsEndpointStatus: response.status,
      apiKeyConfigured: Boolean(process.env.AI_API_KEY),
      checkedAt: new Date().toISOString(),
      note: response.ok ? "استجاب مسار models لدى المزوّد؛ لم يتم التحقق من صلاحية النموذج لتنفيذ محادثة." : "استجاب الخادم لكن مسار models أعاد حالة غير ناجحة."
    }, { status: response.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ state: "UNREACHABLE", reachable: false, configuredModel: model, error: "تعذر الوصول إلى مزوّد النموذج خلال 8 ثوانٍ." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
