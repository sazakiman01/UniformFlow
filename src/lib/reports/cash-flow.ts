import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listExpenses } from "@/lib/expenses";
import { round2 } from "@/lib/money";
import { INVOICE_PAYMENTS } from "@/lib/invoices";
import type { CashFlowReport } from "@/types";

export interface CashFlowOptions {
  from: Date;
  to: Date;
}

/**
 * Cash flow = actual money in/out (not accrual).
 * Inflow = invoice payments collected.
 * Outflow = expenses paid.
 */
export async function buildCashFlowReport(opts: CashFlowOptions): Promise<CashFlowReport> {
  // Inflow: payments
  const paymentsQ = query(
    collection(db, INVOICE_PAYMENTS),
    where("paidAt", ">=", Timestamp.fromDate(opts.from)),
    where("paidAt", "<=", Timestamp.fromDate(opts.to)),
    orderBy("paidAt", "asc"),
  );
  const paymentsSnap = await getDocs(paymentsQ);
  const totalPayments = round2(
    paymentsSnap.docs.reduce((s, d) => s + ((d.data().amount as number) ?? 0), 0),
  );

  // Outflow: expenses
  const expenses = await listExpenses({ from: opts.from, to: opts.to, max: 5000 });
  const totalExpenses = round2(expenses.reduce((s, e) => s + e.totalAmount, 0));

  return {
    period: { from: opts.from, to: opts.to },
    inflow: { total: totalPayments, payments: totalPayments, other: 0 },
    outflow: { total: totalExpenses, expenses: totalExpenses, other: 0 },
    net: round2(totalPayments - totalExpenses),
    generatedAt: new Date(),
  };
}
