import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";
type Finding = { severity: "high" | "medium" | "low" | "info"; code: string; location: string; message: string; recommendation: string };
const methods = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);
function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;
  let rawBody: string;
  try { rawBody = await req.text(); }
  catch { return NextResponse.json({ error: "تعذرت قراءة الملف المرسل." }, { status: 400 }); }
  if (Buffer.byteLength(rawBody, "utf8") > 1_048_576) {
    return NextResponse.json({ error: "حجم ملف OpenAPI يتجاوز الحد المسموح (1 MB)." }, { status: 413 });
  }

  let body: unknown;
  try { body = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "أرسل JSON صالحًا بالشكل { spec: {...} }." }, { status: 400 }); }
  if (!isRecord(body) || !isRecord(body.spec)) return NextResponse.json({ error: "لم يتم العثور على كائن spec صالح." }, { status: 400 });

  const spec = body.spec;
  const version = typeof spec.openapi === "string" ? spec.openapi : "";
  if (!version.startsWith("3.")) return NextResponse.json({ error: "الإصدار المدعوم حاليًا هو OpenAPI 3.x بصيغة JSON." }, { status: 422 });
  if (!isRecord(spec.paths)) return NextResponse.json({ error: "ملف OpenAPI لا يحتوي على paths صالحة." }, { status: 422 });

  const findings: Finding[] = [];
  const globalSecurity = Array.isArray(spec.security) ? spec.security : undefined;
  const schemes = isRecord(spec.components) && isRecord(spec.components.securitySchemes) ? Object.keys(spec.components.securitySchemes) : [];
  const paths = Object.entries(spec.paths);
  let operations = 0;
  let unauthenticated = 0;
  if (!schemes.length) findings.push({
    severity: "high", code: "NO_SECURITY_SCHEMES", location: "components.securitySchemes",
    message: "لا توجد آليات مصادقة معرفة في ملف المواصفات.",
    recommendation: "عرّف آلية مناسبة مثل OAuth2 أو OpenID Connect أو HTTP Bearer، ثم اربطها بالعمليات."
  });

  for (const [path, pathItemValue] of paths) {
    if (!isRecord(pathItemValue)) continue;
    const pathParameters = Array.isArray(pathItemValue.parameters) ? pathItemValue.parameters : [];
    for (const [method, operationValue] of Object.entries(pathItemValue)) {
      if (!methods.has(method.toLowerCase()) || !isRecord(operationValue)) continue;
      operations++;
      const operation = operationValue;
      const location = `${method.toUpperCase()} ${path}`;
      const effectiveSecurity = Array.isArray(operation.security) ? operation.security : globalSecurity;
      const isPublic = effectiveSecurity === undefined || effectiveSecurity.length === 0;
      if (isPublic) {
        unauthenticated++;
        findings.push({
          severity: ["delete", "put", "patch", "post"].includes(method.toLowerCase()) ? "high" : "medium",
          code: "OPERATION_WITHOUT_AUTH", location,
          message: "هذه العملية لا تفرض متطلبات مصادقة وفق ملف المواصفات.",
          recommendation: "راجع ما إذا كانت العملية عامة عمدًا؛ وإلا أضف security مناسبًا على مستوى العملية أو المستند."
        });
      } else {
        for (const requirement of effectiveSecurity) {
          if (!isRecord(requirement)) continue;
          for (const schemeName of Object.keys(requirement)) {
            if (!schemes.includes(schemeName)) findings.push({
              severity: "medium", code: "UNDEFINED_SECURITY_SCHEME", location,
              message: `تشير العملية إلى آلية مصادقة غير معرفة: ${schemeName}.`,
              recommendation: "عرّف الآلية في components.securitySchemes أو صحح اسم المرجع."
            });
          }
        }
      }

      const params = [...pathParameters, ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
      const declared = new Set(params.filter(isRecord).filter((p) => p.in === "path" && typeof p.name === "string").map((p) => p.name));
      const placeholders = Array.from(path.matchAll(/\{([^}]+)\}/g), (match) => match[1]);
      for (const paramName of placeholders) if (!declared.has(paramName)) findings.push({
        severity: "medium", code: "UNDECLARED_PATH_PARAMETER", location,
        message: `المعامل {${paramName}} في المسار غير موثق كمعامل path.`,
        recommendation: "أضف parameter بالاسم نفسه واجعل required=true."
      });
      if (["post", "put", "patch"].includes(method.toLowerCase()) && !operation.requestBody) findings.push({
        severity: "low", code: "MISSING_REQUEST_BODY", location,
        message: "عملية تعديل أو إنشاء لا توثق requestBody.",
        recommendation: "تحقق مما إذا كانت العملية تحتاج جسم طلب موثقًا؛ قد يكون غيابه مقصودًا."
      });
      if (!operation.operationId) findings.push({
        severity: "info", code: "MISSING_OPERATION_ID", location,
        message: "العملية لا تحتوي على operationId.",
        recommendation: "أضف operationId فريدًا لتحسين التوليد والتكامل والتتبع."
      });
      if (method.toLowerCase() === "trace") findings.push({
        severity: "medium", code: "TRACE_METHOD_DECLARED", location,
        message: "تم توثيق طريقة HTTP TRACE.",
        recommendation: "عطّل TRACE على الخادم ما لم توجد حاجة موثقة ومراجعة."
      });
    }
  }

  const counts = findings.reduce((acc, item) => { acc[item.severity]++; return acc; }, { high: 0, medium: 0, low: 0, info: 0 });
  return NextResponse.json({
    product: "ZALAM AI", mode: "STATIC_OPENAPI_REVIEW", openapiVersion: version,
    title: isRecord(spec.info) && typeof spec.info.title === "string" ? spec.info.title : null,
    serverDeclarations: Array.isArray(spec.servers) ? spec.servers.length : 0,
    paths: paths.length, operations, securitySchemes: schemes,
    unauthenticatedOperations: unauthenticated,
    summary: { findings: findings.length, ...counts },
    findings: findings.slice(0, 300),
    limitations: [
      "تحليل ساكن لملف OpenAPI JSON فقط؛ لا يتم الاتصال بالخوادم أو تنفيذ الطلبات.",
      "النتائج مؤشرات للمراجعة وليست إثباتًا لوجود ثغرة أو غيابها.",
      "لا يحلل حاليًا YAML أو تفاصيل التنفيذ الفعلي أو صلاحيات المستخدمين وقت التشغيل."
    ],
    reviewedAt: new Date().toISOString()
  });
}
