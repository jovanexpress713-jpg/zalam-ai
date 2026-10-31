import { NextRequest, NextResponse } from "next/server";
import { requireAppAccess } from "@/lib/app-auth";

export const runtime = "nodejs";

type SimulatedTransfer = {
  id: string;
  from: string;
  to: string;
  amount: number;
  sequence: number;
  timestamp: string;
  simulated: true;
};

export async function POST(req: NextRequest) {
  const denied = requireAppAccess(req);
  if (denied) return denied;

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const amount = body.amount ?? 30000;
  if (!Number.isFinite(amount) || amount < 100 || amount > 100000) {
    return NextResponse.json({ error: "المبلغ التجريبي يجب أن يكون بين 100 و100000." }, { status: 400 });
  }

  // Synthetic-only ledger: no payment rails, real wallets, external APIs or funds.
  const wallets = ["SIM-SOURCE-001", "SIM-HOP-014", "SIM-HOP-027", "SIM-HOP-039", "SIM-DEST-099"];
  const now = Date.now();
  const transfers: SimulatedTransfer[] = wallets.slice(0, -1).map((from, index) => ({
    id: `SIM-TX-${index + 1}`,
    from,
    to: wallets[index + 1],
    amount: Math.round((amount * (1 - index * 0.0125) + Number.EPSILON) * 100) / 100,
    sequence: index + 1,
    timestamp: new Date(now + index * 15000).toISOString(),
    simulated: true
  }));

  const graph = new Map<string, string[]>();
  for (const transfer of transfers) {
    graph.set(transfer.from, [...(graph.get(transfer.from) ?? []), transfer.to]);
  }

  const visited = new Set<string>();
  const queue = [wallets[0]];
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of graph.get(current) ?? []) queue.push(next);
  }

  const detected = transfers.length >= 3 && visited.has(wallets[wallets.length - 1]);
  return NextResponse.json({
    mode: "FINANCIAL_CRIME_SIMULATION",
    simulated: true,
    externalSystemsContacted: false,
    realFundsMoved: false,
    requestedAmount: amount,
    currency: "USD (synthetic)",
    wallets,
    transfers,
    detection: {
      suspiciousLayeringDetected: detected,
      linkedWalletCount: visited.size,
      linkedTransferCount: transfers.length,
      sourceToDestinationTraceable: visited.has(wallets[wallets.length - 1]),
      severity: detected ? "HIGH" : "LOW",
      findings: detected
        ? ["سلسلة تحويلات متتابعة بين محافظ متعددة", "إمكانية ربط المحافظ عبر تسلسل المعاملات", "يجب تصعيد الحالة للمراجعة والتحقق من مصدر الأموال"]
        : []
    },
    completedAt: new Date().toISOString(),
    notice: "محاكاة تعليمية ببيانات اصطناعية فقط؛ لا توجد محافظ حقيقية أو تحويلات أو أموال."
  });
}
