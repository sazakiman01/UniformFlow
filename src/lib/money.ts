import type { DocumentLineItem, PriceMode } from '@/types';

/** Round to 2 decimal places (banker's-safe enough for THB cents) */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Format THB amount: 1234.5 -> "1,234.50" */
export function formatTHB(amount: number, withSymbol = false): string {
  const formatted = amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withSymbol ? `฿${formatted}` : formatted;
}

/** Validate Thai 13-digit Tax Identification Number with checksum */
export function isValidThaiTaxId(taxId: string): boolean {
  const digits = taxId.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

export interface DocumentTotals {
  subtotal: number;       // sum of (qty * unitPrice) before line discounts
  lineDiscounts: number;  // sum of line-level discounts
  netBeforeVat: number;   // subtotal - lineDiscounts - documentDiscount
  vatAmount: number;
  grandTotal: number;     // netBeforeVat + vatAmount  (or = netBeforeVat if inclusive)
  whtAmount: number;
  amountDue: number;      // grandTotal - whtAmount
}

export interface ComputeTotalsInput {
  items: DocumentLineItem[];
  priceMode: PriceMode;       // 'inclusive' = unitPrice already includes VAT
  vatRate: number;             // e.g., 7 (percent)
  documentDiscount?: number;   // amount discount on whole document
  whtRate?: number;            // 0, 1, 2, 3, 5 (percent)
}

/**
 * Compute money totals for an invoice/quotation/credit-note.
 * - exclusive: unitPrice excludes VAT → VAT added on top
 * - inclusive: unitPrice includes VAT → extract VAT from total
 *
 * All values rounded to 2 decimals; line totals are recomputed.
 */
export function computeTotals(input: ComputeTotalsInput): DocumentTotals {
  const { items, priceMode, vatRate, documentDiscount = 0, whtRate = 0 } = input;
  let subtotal = 0;
  let lineDiscounts = 0;
  for (const item of items) {
    const lineGross = item.quantity * item.unitPrice;
    const lineDiscount = item.discount ?? 0;
    subtotal += lineGross;
    lineDiscounts += lineDiscount;
  }
  const netGross = subtotal - lineDiscounts - documentDiscount;
  let netBeforeVat: number;
  let vatAmount: number;
  let grandTotal: number;
  if (priceMode === 'inclusive') {
    // Price already includes VAT — extract VAT
    grandTotal = netGross;
    netBeforeVat = round2(netGross / (1 + vatRate / 100));
    vatAmount = round2(grandTotal - netBeforeVat);
  } else {
    netBeforeVat = round2(netGross);
    vatAmount = round2(netBeforeVat * (vatRate / 100));
    grandTotal = round2(netBeforeVat + vatAmount);
  }
  const whtAmount = round2(netBeforeVat * (whtRate / 100));
  const amountDue = round2(grandTotal - whtAmount);
  return {
    subtotal: round2(subtotal),
    lineDiscounts: round2(lineDiscounts),
    netBeforeVat,
    vatAmount,
    grandTotal,
    whtAmount,
    amountDue,
  };
}

/** Recompute the total field on each line item (qty * unitPrice - discount). */
export function normalizeLineItems(items: DocumentLineItem[]): DocumentLineItem[] {
  return items.map((it) => ({
    ...it,
    total: round2(it.quantity * it.unitPrice - (it.discount ?? 0)),
  }));
}

/**
 * Convert THB number to Thai text (บาทถ้วน / สตางค์)
 * For invoice "จำนวนเงินเป็นตัวอักษร"
 */
export function bahtText(amount: number): string {
  const num = Math.abs(round2(amount));
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  const txt = (n: number): string => {
    if (n === 0) return '';
    const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const places = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    const s = n.toString();
    let result = '';
    for (let i = 0; i < s.length; i++) {
      const d = Number(s[i]);
      const p = s.length - i - 1;
      if (d === 0) continue;
      if (p === 0 && d === 1 && s.length > 1) result += 'เอ็ด';
      else if (p === 1 && d === 2) result += 'ยี่' + places[p];
      else if (p === 1 && d === 1) result += places[p];
      else result += digits[d] + places[p];
    }
    return result;
  };
  // Handle ล้าน
  const millions = Math.floor(baht / 1_000_000);
  const remainder = baht % 1_000_000;
  let bahtTxt = '';
  if (millions > 0) bahtTxt += txt(millions) + 'ล้าน';
  if (remainder > 0) bahtTxt += txt(remainder);
  if (baht === 0) bahtTxt = 'ศูนย์';
  let result = bahtTxt + 'บาท';
  if (satang === 0) result += 'ถ้วน';
  else result += txt(satang) + 'สตางค์';
  return result;
}
