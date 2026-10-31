import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;

  const providerConfigured = Boolean(process.env.AI_BASE_URL && process.env.AI_MODEL);
  const providerKeyConfigured = Boolean(process.env.AI_API_KEY);
  const labTargetConfigured = Boolean(process.env.ZALAM_LAB_TARGET_URL && process.env.ZALAM_LAB_ALLOWED_HOST);
  return NextResponse.json({
    app: "ZALAM AI",
    state: providerConfigured ? "CONFIGURED" : "CONFIGURATION_REQUIRED",
    provider: {
      configured: providerConfigured,
      apiKeyConfigured: providerKeyConfigured,
      modelConfigured: Boolean(process.env.AI_MODEL)
    },
    securityLab: {
      configured: labTargetConfigured,
      mode: "PASSIVE_CHECKS_ONLY",
      note: "الفحص يعمل فقط على الهدف الذي يحدده مسؤول النظام في إعدادات الخادم."
    },
    capabilities: ["chat", "local_history", "passive_security_headers", "tls_certificate_assessment", "dns_posture_inventory"],
    generatedAt: new Date().toISOString()
  });
}
