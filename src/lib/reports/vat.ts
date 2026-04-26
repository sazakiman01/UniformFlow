import { listInvoices } from "@/lib/invoices";
import { listExpenses } from "@/lib/expenses";
import { round2 } from "@/lib/money";
import type { VATReport } from "@/types";

export interface VATOptions {
  /** Year (B.E. or A.D.). Stored as A.D. internally. */
  year: number;
  /** Month 1-12 */
  month: number;
}

/**
 * Build monthly VAT report (ภพ.30).
 * Output VAT = VAT collected from sold invoices (tax_invoice or tax_invoice_receipt).
 * Input VAT = VAT paid on purchases (expenses with isPurchaseTaxClaim=true).
 * VAT due = output - input (or refund if negative).
 */
export async function buildVATReport(opts: VATOptions): Promise<VATReport> {
  const from = new Date(opts.year, opts.month - 1, 1);
  const to = new Date(opts.year, opts.month, 0, 23, 59, 59);

  const [invoices, expenses] = await Promise.all([
    listInvoices({ max: 5000 }),
    listExpenses({ from, to, max: 5000 }),
  ]);

  const taxInvoices = invoices.filter(
    (inv) =>
      (inv.type === "tax_invoice" || inv.type === "tax_invoice_receipt") &&
      inv.status !== "cancelled" &&
      inv.status !== "void" &&
      inv.issueDate >= from &&
      inv.issueDate <= to,
  );

  const purchases = expenses.filter((e) => e.isPurchaseTaxClaim);

  const outputVAT = round2(taxInvoices.reduce((s, inv) => s + inv.vatAmount, 0));
  const outputBase = round2(taxInvoices.reduce((s, inv) => s + inv.netAmount, 0));
  const inputVAT = round2(purchases.reduce((s, e) => s + (e.vatAmount ?? 0), 0));
  const inputBase = round2(purchases.reduce((s, e) => s + e.amount, 0));

  const vatDue = round2(outputVAT - inputVAT);

  return {
    period: { year: opts.year, month: opts.month },
    output: {
      base: outputBase,
      vat: outputVAT,
      invoiceCount: taxInvoices.length,
      invoices: taxInvoices.map((inv) => ({
        invoiceId: inv.id,
        number: inv.number,
        issueDate: inv.issueDate,
        customerName: inv.customerSnapshot?.name ?? "",
        customerTaxId: inv.customerSnapshot?.taxId,
        netAmount: inv.netAmount,
        vatAmount: inv.vatAmount,
      })),
    },
    input: {
      base: inputBase,
      vat: inputVAT,
      expenseCount: purchases.length,
      expenses: purchases.map((e) => ({
        expenseId: e.id,
        number: e.number,
        paidAt: e.paidAt,
        supplierName: e.supplier ?? "",
        supplierTaxId: e.supplierTaxId,
        supplierTaxInvoiceNumber: e.supplierTaxInvoiceNumber,
        amount: e.amount,
        vatAmount: e.vatAmount ?? 0,
      })),
    },
    vatDue,
    isRefund: vatDue < 0,
    generatedAt: new Date(),
  };
}

/** Format VAT report as CSV for export to RD or accountant. */
export function vatReportToCSV(report: VATReport): string {
  const lines: string[][] = [
    ["รายงานภาษีมูลค่าเพิ่ม (ภพ.30)"],
    [`ประจำเดือน ${report.period.month}/${report.period.year}`],
    [],
    ["─── ภาษีขาย (Output VAT) ───"],
    ["เลขที่", "วันที่", "ลูกค้า", "เลขประจำตัวผู้เสียภาษี", "ฐาน", "VAT"],
    ...report.output.invoices.map((i) => [
      i.number,
      i.issueDate.toLocaleDateString("th-TH"),
      i.customerName,
      i.customerTaxId ?? "",
      i.netAmount.toFixed(2),
      i.vatAmount.toFixed(2),
    ]),
    ["", "", "", "รวม", report.output.base.toFixed(2), report.output.vat.toFixed(2)],
    [],
    ["─── ภาษีซื้อ (Input VAT) ───"],
    ["เลขที่ใน UF", "วันที่", "ผู้ขาย", "TIN", "เลขใบกำกับ", "ฐาน", "VAT"],
    ...report.input.expenses.map((e) => [
      e.number,
      e.paidAt.toLocaleDateString("th-TH"),
      e.supplierName,
      e.supplierTaxId ?? "",
      e.supplierTaxInvoiceNumber ?? "",
      e.amount.toFixed(2),
      e.vatAmount.toFixed(2),
    ]),
    ["", "", "", "", "รวม", report.input.base.toFixed(2), report.input.vat.toFixed(2)],
    [],
    [report.isRefund ? "VAT ขอคืน" : "VAT ต้องชำระ", "", "", "", "", "", Math.abs(report.vatDue).toFixed(2)],
  ];
  return "\uFEFF" + lines.map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
}
