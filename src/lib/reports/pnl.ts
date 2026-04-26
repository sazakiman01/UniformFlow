import { listInvoices } from "@/lib/invoices";
import { listExpenses } from "@/lib/expenses";
import { round2 } from "@/lib/money";
import type { PLReport } from "@/types";

export interface PLOptions {
  from: Date;
  to: Date;
}

/**
 * Build P&L report for the given period.
 * Revenue = sum of invoice.netAmount (excl VAT) for non-cancelled invoices issued in period.
 * COGS = expenses with isCOGS=true, paid in period.
 * Operating expenses = other expenses, paid in period.
 */
export async function buildPLReport(opts: PLOptions): Promise<PLReport> {
  const [invoices, expenses] = await Promise.all([
    listInvoices({ max: 5000 }),
    listExpenses({ from: opts.from, to: opts.to, max: 5000 }),
  ]);

  const inPeriodInv = invoices.filter(
    (inv) =>
      inv.status !== "cancelled" &&
      inv.status !== "void" &&
      inv.issueDate >= opts.from &&
      inv.issueDate <= opts.to,
  );

  const revenue = round2(inPeriodInv.reduce((s, inv) => s + inv.netAmount, 0));
  const cogs = round2(
    expenses.filter((e) => e.isCOGS).reduce((s, e) => s + e.amount, 0),
  );
  const opex = round2(
    expenses.filter((e) => !e.isCOGS).reduce((s, e) => s + e.amount, 0),
  );

  const grossProfit = round2(revenue - cogs);
  const grossMarginPct = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;
  const netProfit = round2(grossProfit - opex);
  const netMarginPct = revenue > 0 ? round2((netProfit / revenue) * 100) : 0;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  for (const e of expenses) {
    expensesByCategory[e.category] = round2(
      (expensesByCategory[e.category] ?? 0) + e.amount,
    );
  }

  return {
    period: { from: opts.from, to: opts.to },
    revenue,
    cogs,
    grossProfit,
    grossMarginPct,
    operatingExpenses: opex,
    netProfit,
    netMarginPct,
    expensesByCategory,
    generatedAt: new Date(),
  };
}
