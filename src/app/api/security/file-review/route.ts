import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";
const MAX_BYTES = 1_048_576;
const allowedExtensions = new Set(["txt", "md", "json", "yaml", "yml", "js", "jsx", "ts", "tsx", "py", "html", "css", "sql", "xml", "sh", "toml", "ini", "log"]);
type Finding = { severity: "high" | "medium" | "low"; code: string; line: number; message: string; recommendation: string };

export async function POST(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;
  const raw = await req.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > MAX_BYTES) return NextResponse.json({ error: "الملف يتجاوز الحد الأقصى 1 MB." }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "أرسل JSON صالحًا يحتوي name و content." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "بيانات الملف غير صالحة." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.name !== "string" || typeof input.content !== "string" || !input.name.trim()) return NextResponse.json({ error: "اسم الملف ومحتواه مطلوبان." }, { status: 400 });
  const name = input.name.split(/[\/]/).pop() || "";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (!allowedExtensions.has(ext)) return NextResponse.json({ error: "امتداد الملف غير مدعوم للتحليل النصي." }, { status: 415 });
  const content = input.content;
  if (content.length > MAX_BYTES || content.includes("\u0000")) return NextResponse.json({ error: "الملف ليس نصيًا صالحًا أو يتجاوز الحد." }, { status: 415 });
  const lines = content.split(/\r?\n/);
  const findings: Finding[] = [];
  const rules: { code: string; severity: Finding["severity"]; pattern: RegExp; message: string; recommendation: string }[] = [
    { code: "PRIVATE_KEY_MATERIAL", severity: "high", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, message: "يبدو أن الملف يحتوي على مادة مفتاح خاص.", recommendation: "أزل المفتاح من الملف ودوّره فورًا إذا كان حقيقيًا." },
    { code: "CLOUD_ACCESS_KEY", severity: "high", pattern: /\bAKIA[0-9A-Z]{16}\b/, message: "نمط يشبه مفتاح وصول سحابي.", recommendation: "تحقق منه وألغِ المفتاح المكشوف وأنشئ بديلًا محدود الصلاحيات." },
    { code: "GENERIC_SECRET", severity: "high", pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{12,}["']/i, message: "قيمة تبدو كسر أو كلمة مرور ثابتة.", recommendation: "انقل الأسرار إلى مخزن أسرار أو متغيرات بيئة ولا ترفعها للمستودع." },
    { code: "DYNAMIC_CODE_EXECUTION", severity: "medium", pattern: /\b(?:eval\s*\(|new Function\s*\(|exec\s*\(|child_process\.(?:exec|spawn))/, message: "تم العثور على نمط تنفيذ ديناميكي أو أوامر نظام.", recommendation: "راجع مصدر المدخلات، وقيّد التنفيذ أو استبدله بواجهات محددة وآمنة." },
    { code: "DISABLED_TLS_VALIDATION", severity: "high", pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0/, message: "تعطيل التحقق من شهادات TLS.", recommendation: "أعد التحقق من الشهادات ولا تتجاوز أخطاء TLS في الإنتاج." },
    { code: "SQL_STRING_CONCAT", severity: "medium", pattern: /(?:SELECT|UPDATE|DELETE|INSERT)[^\n]{0,100}\+\s*(?:req\.|request\.|params\.|query\.)/i, message: "احتمال بناء استعلام SQL بدمج مدخلات مباشرة.", recommendation: "استخدم الاستعلامات المعلّمة أو معاملات قاعدة البيانات." },
    { code: "WILDCARD_CORS", severity: "low", pattern: /Access-Control-Allow-Origin\s*[:=]\s*["']\*["']|cors\s*\(\s*\)/i, message: "سياسة CORS قد تسمح لجميع المصادر.", recommendation: "حدد مصادر الواجهة الموثوقة بدل السماح العام عند استخدام بيانات حساسة." }
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const rule of rules) if (rule.pattern.test(lines[i])) findings.push({ severity: rule.severity, code: rule.code, line: i + 1, message: rule.message, recommendation: rule.recommendation });
  }
  const unique = findings.filter((item, index, all) => all.findIndex((other) => other.code === item.code && other.line === item.line) === index).slice(0, 300);
  return NextResponse.json({
    product: "ZALAM AI", mode: "STATIC_TEXT_FILE_REVIEW", fileName: name,
    metrics: { bytes: Buffer.byteLength(content, "utf8"), lines: lines.length, findings: unique.length },
    summary: { high: unique.filter(x => x.severity === "high").length, medium: unique.filter(x => x.severity === "medium").length, low: unique.filter(x => x.severity === "low").length },
    findings: unique,
    limitations: ["تحليل ساكن قائم على أنماط محددة وليس فحصًا شاملًا أو إثباتًا للاستغلال.", "لا يتم تشغيل الملف أو حفظه أو إرساله إلى مزوّد ذكاء اصطناعي.", "قد تظهر نتائج إيجابية أو سلبية كاذبة؛ راجع السياق يدويًا."]
  });
}
