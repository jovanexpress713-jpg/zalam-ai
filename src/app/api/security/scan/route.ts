import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";

function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const p = address.split(".").map(Number);
    const [a, b] = p;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 0 || b === 168)) return false;
    if (a === 198 && (p[2] === 18 || p[2] === 19 || p[2] === 51)) return false;
    if (a === 203 && b === 0 && p[2] === 113) return false;
    return true;
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized.startsWith("2") || normalized.startsWith("3");
  }
  return false;
}

const checks = [
  { header: "strict-transport-security", title: "HSTS", recommendation: "فعّل Strict-Transport-Security على HTTPS." },
  { header: "content-security-policy", title: "Content Security Policy", recommendation: "أضف سياسة CSP مناسبة لتقليل مخاطر حقن المحتوى." },
  { header: "x-content-type-options", title: "MIME sniffing protection", recommendation: "اضبط X-Content-Type-Options: nosniff." },
  { header: "x-frame-options", title: "Clickjacking protection", recommendation: "اضبط X-Frame-Options أو frame-ancestors في CSP." },
  { header: "referrer-policy", title: "Referrer Policy", recommendation: "اضبط Referrer-Policy بقيمة مناسبة." },
  { header: "permissions-policy", title: "Permissions Policy", recommendation: "قيّد واجهات المتصفح غير المستخدمة عبر Permissions-Policy." }
];

export async function POST(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;

  const configured = process.env.ZALAM_LAB_TARGET_URL;
  const allowedHost = process.env.ZALAM_LAB_ALLOWED_HOST?.toLowerCase();
  if (!configured || !allowedHost) {
    return NextResponse.json({ error: "مختبر الفحص غير مضبوط. أضف ZALAM_LAB_TARGET_URL و ZALAM_LAB_ALLOWED_HOST للخادم." }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(configured);
  } catch {
    return NextResponse.json({ error: "عنوان هدف المختبر غير صالح." }, { status: 500 });
  }
  if (target.protocol !== "https:" || target.hostname.toLowerCase() !== allowedHost ||
      target.username || target.password || target.hostname === "localhost" ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(target.hostname)) {
    return NextResponse.json({ error: "الهدف يجب أن يكون HTTPS وباسم المضيف المطابق تمامًا لقائمة السماح." }, { status: 403 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const addresses = await lookup(target.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) {
      return NextResponse.json({ error: "تم رفض الهدف لأن اسم المضيف لا يحلّ إلى عناوين عامة مسموح بها." }, { status: 403 });
    }
    const response = await fetch(target, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "ZALAM-AI-Passive-Security-Check/1.0" },
      cache: "no-store"
    });
    const results = checks.map((check) => ({
      name: check.title,
      status: response.headers.has(check.header) ? "present" : "missing",
      recommendation: response.headers.has(check.header) ? null : check.recommendation
    }));
    const cookie = response.headers.get("set-cookie") || "";
    if (cookie) {
      results.push({
        name: "Cookie security flags",
        status: /httponly/i.test(cookie) && /secure/i.test(cookie) && /samesite=/i.test(cookie) ? "present" : "review",
        recommendation: /httponly/i.test(cookie) && /secure/i.test(cookie) && /samesite=/i.test(cookie) ? null : "راجع خصائص Secure و HttpOnly و SameSite لملفات الارتباط."
      });
    }
    const missing = results.filter((item) => item.status !== "present").length;
    return NextResponse.json({
      target: target.origin,
      mode: "PASSIVE_HTTP_CONFIGURATION",
      httpStatus: response.status,
      checkedAt: new Date().toISOString(),
      summary: { total: results.length, passed: results.length - missing, needsReview: missing },
      results,
      limitations: ["هذا فحص سلبي لترويسات HTTP فقط؛ لا يثبت خلو الموقع من الثغرات.", "يستخدم الفحص طلب HEAD دون تنزيل محتوى الصفحة أو تعديل بيانات.", "تُرفض عناوين DNS الخاصة والمحلية؛ استخدم نطاقًا عامًا مخصصًا للمختبر."]
    });
  } catch {
    return NextResponse.json({ error: "تعذر الوصول إلى هدف المختبر ضمن مهلة 10 ثوانٍ." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
