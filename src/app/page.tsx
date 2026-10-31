"use client";

import { FormEvent, useEffect, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("أدخل رمز الوصول للمتابعة");

  useEffect(() => {
    setAccessToken(sessionStorage.getItem("zalam-access-token") || "");
  }, []);

  function saveToken(value: string) {
    setAccessToken(value);
    if (value) sessionStorage.setItem("zalam-access-token", value);
    else sessionStorage.removeItem("zalam-access-token");
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
        headers: {
          "Content-Type": "application/json",
          "x-zalam-access-token": accessToken.trim()
        },
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 pb-5">
        <div><div className="text-2xl font-black tracking-widest">ZALAM <span className="text-red-500">AI</span></div><p className="mt-1 text-xs text-slate-400">منصة قابلة للفحص والتطوير</p></div>
        <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">{status}</span>
      </header>
      <section className="mx-auto flex min-h-[75vh] max-w-5xl flex-col py-8">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h1 className="text-xl font-bold">مساحة العمل</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">أدخل رمز الوصول الذي ضبطته على الخادم. يُحفظ في جلسة المتصفح الحالية فقط. هذا رمز وصول مشترك وليس نظام حسابات مستخدمين.</p>
          <label className="mt-4 block text-xs text-slate-400" htmlFor="access-token">رمز الوصول</label>
          <input id="access-token" type="password" autoComplete="current-password" value={accessToken} onChange={e => saveToken(e.target.value)} placeholder="ZALAM_ACCESS_TOKEN" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-red-500" />
          <p className="mt-3 text-xs leading-6 text-slate-500">الأدوات والوكلاء ومختبر الأمن لا تُعد مفعّلة لمجرد ظهور هذه الواجهة؛ يلزم تنفيذها واختبارها كلٌّ على حدة.</p>
        </div>
        <div className="flex-1 space-y-4">
          {messages.length === 0 && <div className="py-16 text-center text-sm text-slate-500">اكتب رسالتك لبدء المحادثة</div>}
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
