"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
type FinancialSimulation = { requestedAmount:number; currency:string; wallets:string[]; transfers:{id:string;from:string;to:string;amount:number;sequence:number}[]; detection:{suspiciousLayeringDetected:boolean;linkedWalletCount:number;linkedTransferCount:number;sourceToDestinationTraceable:boolean;severity:string;findings:string[]}; notice:string };
type ScanResult = {
  target: string;
  mode: string;
  httpStatus: number;
  checkedAt: string;
  summary: { total: number; passed: number; needsReview: number };
  results: { name: string; status: string; recommendation: string | null }[];
  limitations: string[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("أدخل رمز الوصول للمتابعة");
  const [historyReady, setHistoryReady] = useState(false);
  const [labBusy, setLabBusy] = useState(false);
  const [labMessage, setLabMessage] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [simulation, setSimulation] = useState<FinancialSimulation | null>(null);
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<{state:string;provider:{configured:boolean};securityLab:{configured:boolean;mode:string}} | null>(null);

  useEffect(() => {
    setAccessToken(sessionStorage.getItem("zalam-access-token") || "");
    try {
      const saved = localStorage.getItem("zalam-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-100));
      }
    } catch { localStorage.removeItem("zalam-chat-history"); }
    setHistoryReady(true);
  }, []);

  useEffect(() => {
    if (historyReady) localStorage.setItem("zalam-chat-history", JSON.stringify(messages.slice(-100)));
  }, [messages, historyReady]);

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem("zalam-chat-history");
  }

  function saveToken(value: string) {
    setAccessToken(value);
    if (value) sessionStorage.setItem("zalam-access-token", value);
    else sessionStorage.removeItem("zalam-access-token");
  }

  async function authorizedFetch(path: string, method = "GET") {
    return fetch(path, { method, headers: { "x-zalam-access-token": accessToken.trim() }, cache: "no-store" });
  }

  async function loadStatus() {
    if (!accessToken.trim()) return;
    setLabBusy(true);
    setLabMessage("");
    try {
      const response = await authorizedFetch("/api/status");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر قراءة حالة النظام");
      setRuntimeInfo(data);
      setLabMessage("تم فحص إعدادات الخادم.");
    } catch (error) {
      setLabMessage(error instanceof Error ? error.message : "تعذر فحص الحالة");
    } finally { setLabBusy(false); }
  }

  async function runFinancialSimulation() {
    if (!accessToken.trim() || simulationBusy) return;
    setSimulationBusy(true);
    setSimulation(null);
    try {
      const response = await fetch("/api/security/financial-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-zalam-access-token": accessToken.trim() },
        body: JSON.stringify({ amount: 30000 }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذرت المحاكاة");
      setSimulation(data);
    } catch (error) {
      setLabMessage(error instanceof Error ? error.message : "تعذرت المحاكاة");
    } finally { setSimulationBusy(false); }
  }

  async function runPassiveScan() {
    if (!accessToken.trim()) return;
    setLabBusy(true);
    setLabMessage("");
    setScanResult(null);
    try {
      const response = await authorizedFetch("/api/security/scan", "POST");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تنفيذ الفحص");
      setScanResult(data);
      setLabMessage("اكتمل الفحص السلبي للهدف المضبوط على الخادم.");
    } catch (error) {
      setLabMessage(error instanceof Error ? error.message : "تعذر تنفيذ الفحص");
    } finally { setLabBusy(false); }
  }

  function exportScanReport() {
    if (!scanResult) return;
    const report = {
      product: "ZALAM AI",
      reportType: "PASSIVE_HTTP_CONFIGURATION",
      generatedAt: new Date().toISOString(),
      assessment: scanResult,
      disclaimer: "Passive HTTP response-header review only. This is not a penetration test and does not establish that the target is free of vulnerabilities."
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "zalam-security-assessment.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || busy || !accessToken.trim()) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setPrompt("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-zalam-access-token": accessToken.trim() },
        body: JSON.stringify({ messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إكمال الطلب");
      setMessages([...next, { role: "assistant", content: data.content }]);
      setStatus("متصل بالمزوّد");
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      setMessages([...next, { role: "assistant", content: "تعذر الاتصال بالنموذج: " + message }]);
      setStatus("تعذر الاتصال");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 pb-5">
        <div><div className="text-2xl font-black tracking-widest">ZALAM <span className="text-red-500">AI</span></div><p className="mt-1 text-xs text-slate-400">منصة ذكاء اصطناعي ومختبر أمني مصرح به</p></div>
        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">{status}</span>
      </header>
      <section className="mx-auto max-w-5xl py-8">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3"><h1 className="text-xl font-bold">مساحة العمل</h1><button type="button" onClick={clearHistory} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">مسح المحادثات</button></div>
          <p className="mt-2 text-sm leading-7 text-slate-400">أدخل رمز الوصول المضبوط على الخادم. هذا رمز مشترك وليس نظام حسابات مستخدمين.</p>
          <label className="mt-4 block text-xs text-slate-400" htmlFor="access-token">رمز الوصول</label>
          <input id="access-token" type="password" autoComplete="current-password" value={accessToken} onChange={e => saveToken(e.target.value)} placeholder="ZALAM_ACCESS_TOKEN" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-red-500" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={!accessToken.trim() || labBusy} onClick={loadStatus} className="rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-40">{labBusy ? "جارٍ الفحص..." : "فحص حالة النظام"}</button>
            <button type="button" disabled={!accessToken.trim() || labBusy} onClick={runPassiveScan} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold disabled:opacity-40">{labBusy ? "جارٍ التنفيذ..." : "فحص أمني سلبي للهدف"}</button>
            <button type="button" disabled={!accessToken.trim() || simulationBusy} onClick={runFinancialSimulation} className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm text-amber-200 disabled:opacity-40">{simulationBusy ? "جارٍ تشغيل المحاكاة..." : "محاكاة تتبع 30,000 دولار"}</button>
          </div>
          {runtimeInfo && <div className="mt-4 grid gap-2 rounded-xl bg-black/20 p-4 text-sm sm:grid-cols-3">
            <p>المزوّد: <b>{runtimeInfo.provider.configured ? "مُعدّ" : "يحتاج إعدادًا"}</b></p>
            <p>المختبر: <b>{runtimeInfo.securityLab.configured ? "مُعدّ" : "غير مُعدّ"}</b></p>
            <p>الحالة: <b>{runtimeInfo.state}</b></p>
          </div>}
          {labMessage && <p className="mt-3 text-sm text-slate-300">{labMessage}</p>}
          {simulation && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
            <b>محاكاة مالية اصطناعية — {simulation.requestedAmount.toLocaleString()} {simulation.currency}</b>
            <p className="mt-2 text-sm">تم ربط {simulation.detection.linkedWalletCount} محافظ و{simulation.detection.linkedTransferCount} تحويلات.</p>
            <p className="mt-1 text-sm">اكتشاف التسلسل المشبوه: <b>{simulation.detection.suspiciousLayeringDetected ? "تم اكتشافه" : "لم يُكتشف"}</b> · إمكانية تتبع المصدر: <b>{simulation.detection.sourceToDestinationTraceable ? "نعم" : "لا"}</b></p>
            <ol className="mt-3 space-y-2">{simulation.transfers.map(tx => <li key={tx.id} className="rounded-lg bg-black/20 p-2 text-xs">{tx.id}: {tx.from} ← {tx.to} · {tx.amount.toLocaleString()} USD تجريبي</li>)}</ol>
            <p className="mt-3 text-xs text-slate-400">{simulation.notice}</p>
          </div>}
          {scanResult && <div className="mt-4 rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap justify-between gap-2"><b>نتيجة الفحص: {scanResult.target}</b><span className="text-xs text-slate-400">HTTP {scanResult.httpStatus}</span></div>
            <p className="mt-2 text-sm">اجتاز {scanResult.summary.passed} من {scanResult.summary.total} · يحتاج مراجعة {scanResult.summary.needsReview}</p>
            <button type="button" onClick={exportScanReport} className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200">تصدير التقرير JSON</button>
            <ul className="mt-3 space-y-2">{scanResult.results.map((item) => <li key={item.name} className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-2 text-sm"><span>{item.name}</span><span className={item.status === "present" ? "text-emerald-400" : "text-amber-300"}>{item.status === "present" ? "موجود" : "يحتاج مراجعة"}</span>{item.recommendation && <p className="w-full text-xs text-slate-400">{item.recommendation}</p>}</li>)}</ul>
            <p className="mt-3 text-xs leading-6 text-slate-500">{scanResult.limitations.join(" ")}</p>
          </div>}
          <p className="mt-3 text-xs leading-6 text-slate-500">آخر 100 رسالة تُحفظ محليًا في هذا المتصفح فقط. الفحص الأمني الحالي سلبي لترويسات HTTP على هدف HTTPS محدد مسبقًا في إعدادات الخادم؛ لا ينفذ استغلالًا.</p>
        </div>
        <div className="space-y-4">
          {messages.length === 0 && <div className="py-12 text-center text-sm text-slate-500">اكتب رسالتك لبدء المحادثة</div>}
          {messages.map((m, i) => <article key={i} className={`max-w-[90%] rounded-2xl p-4 text-sm leading-7 ${m.role === "user" ? "mr-auto bg-red-950/40" : "ml-auto bg-white/[0.06]"}`}><div className="mb-1 text-xs text-slate-500">{m.role === "user" ? "أنت" : "ZALAM AI"}</div><p className="whitespace-pre-wrap">{m.content}</p></article>)}
        </div>
        <form onSubmit={send} className="mt-8 rounded-2xl border border-white/10 bg-[#11151d] p-3">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="اكتب رسالتك..." className="w-full resize-none bg-transparent p-3 text-sm outline-none placeholder:text-slate-600" />
          <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-slate-500">لا تضع مفاتيح API أو كلمات مرور هنا</span><button disabled={busy || !prompt.trim() || !accessToken.trim()} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold disabled:opacity-40">{busy ? "جارٍ الإرسال..." : "إرسال"}</button></div>
        </form>
      </section>
    </main>
  );
}
