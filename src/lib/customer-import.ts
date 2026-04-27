import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { CUSTOMERS } from "./customers";
import { isValidThaiTaxId } from "./money";
import type { Address, CustomerType } from "@/types";

export interface ImportRow {
  /** Original row number (1-indexed, excluding header) */
  rowNumber: number;
  name: string;
  customerType: CustomerType;
  branchCode?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address: Address;
  creditTerm?: number;
  contactPerson?: string;
  openingBalance?: number;
  notes?: string;
  /** Validation warnings/errors for this row */
  issues: string[];
  /** Whether this row will be imported */
  willImport: boolean;
}

/**
 * FlowAccount CSV column name mapping (best-effort).
 * FA export columns (in Thai): ชื่อลูกค้า, ประเภท, เลขประจำตัวผู้เสียภาษี, สาขา, เบอร์โทร, อีเมล, ที่อยู่, เครดิต (วัน)
 * Also supports English column names.
 */
const COLUMN_ALIASES: Record<keyof Omit<ImportRow, "rowNumber" | "address" | "issues" | "willImport">, string[]> = {
  name: ["name", "customer", "customer name", "ชื่อ", "ชื่อลูกค้า", "ชื่อกิจการ"],
  customerType: ["type", "customer type", "ประเภท", "ประเภทลูกค้า"],
  branchCode: ["branch", "branch code", "สาขา", "เลขที่สาขา", "รหัสสาขา"],
  taxId: ["tax id", "taxid", "tin", "เลขประจำตัวผู้เสียภาษี", "เลขผู้เสียภาษี"],
  phone: ["phone", "tel", "telephone", "เบอร์โทร", "โทรศัพท์"],
  email: ["email", "e-mail", "อีเมล", "อีเมล์"],
  creditTerm: ["credit term", "credit", "เครดิต", "เครดิต (วัน)", "เทอมเครดิต"],
  contactPerson: ["contact", "contact person", "ผู้ติดต่อ"],
  openingBalance: ["opening balance", "ar opening", "ยอดยกมา", "ลูกหนี้คงค้าง"],
  notes: ["notes", "remark", "หมายเหตุ"],
};

const ADDRESS_ALIASES = ["address", "ที่อยู่", "address full", "ที่อยู่เต็ม"];

/**
 * Find value in a row by trying all aliases (case-insensitive).
 */
function pick(row: Record<string, string>, aliases: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
    if (found && row[found]) return row[found].trim();
  }
  return undefined;
}

/**
 * Parse customerType from Thai/English string.
 */
function parseCustomerType(v: string | undefined): CustomerType {
  if (!v) return "individual";
  const s = v.toLowerCase().trim();
  if (s.includes("นิติ") || s.includes("corp") || s.includes("company") || s.includes("บริษัท"))
    return "corporate";
  return "individual";
}

export function mapRowsToImport(rows: Record<string, string>[]): ImportRow[] {
  return rows.map((r, idx) => {
    const rowNumber = idx + 1;
    const issues: string[] = [];

    const name = pick(r, COLUMN_ALIASES.name);
    if (!name) issues.push("ไม่มีชื่อลูกค้า");

    const customerType = parseCustomerType(pick(r, COLUMN_ALIASES.customerType));
    const taxId = pick(r, COLUMN_ALIASES.taxId)?.replace(/\D/g, "") || undefined;
    if (taxId && !isValidThaiTaxId(taxId)) issues.push("TIN ไม่ถูกต้อง");
    if (customerType === "corporate" && !taxId) issues.push("นิติบุคคลต้องมี TIN");

    const branchCode = pick(r, COLUMN_ALIASES.branchCode) || (customerType === "corporate" ? "00000" : undefined);
    const addrFull = pick(r, ADDRESS_ALIASES) ?? "";
    const creditTermStr = pick(r, COLUMN_ALIASES.creditTerm);
    const creditTerm = creditTermStr ? parseInt(creditTermStr.replace(/\D/g, ""), 10) || 0 : 0;
    const openingBalanceStr = pick(r, COLUMN_ALIASES.openingBalance);
    const openingBalance = openingBalanceStr
      ? parseFloat(openingBalanceStr.replace(/[^\d.-]/g, "")) || 0
      : undefined;

    const address: Address = {
      street: "",
      district: "",
      subdistrict: "",
      province: "",
      postcode: "",
      fullAddress: addrFull,
    };

    return {
      rowNumber,
      name: name ?? "",
      customerType,
      branchCode,
      taxId,
      phone: pick(r, COLUMN_ALIASES.phone),
      email: pick(r, COLUMN_ALIASES.email),
      address,
      creditTerm,
      contactPerson: pick(r, COLUMN_ALIASES.contactPerson),
      openingBalance,
      notes: pick(r, COLUMN_ALIASES.notes),
      issues,
      willImport: issues.length === 0 && !!name,
    };
  });
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { rowNumber: number; message: string }[];
}

/**
 * Bulk import customers using Firestore batches (500 ops each).
 */
export async function importCustomers(
  rows: ImportRow[],
  createdBy: string,
): Promise<ImportResult> {
  const toImport = rows.filter((r) => r.willImport);
  const result: ImportResult = { imported: 0, skipped: rows.length - toImport.length, errors: [] };

  const BATCH_SIZE = 400;
  for (let start = 0; start < toImport.length; start += BATCH_SIZE) {
    const chunk = toImport.slice(start, start + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const r of chunk) {
      try {
        const ref = doc(collection(db, CUSTOMERS));
        const data: Record<string, unknown> = {
          name: r.name,
          customerType: r.customerType,
          branchCode: r.branchCode,
          taxId: r.taxId,
          phone: r.phone,
          email: r.email,
          address: r.address,
          creditTerm: r.creditTerm ?? 0,
          contactPerson: r.contactPerson,
          openingBalance: r.openingBalance,
          notes: r.notes,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        // Strip undefined keys (Firestore rejects undefined)
        Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
        batch.set(ref, data);
      } catch (e) {
        result.errors.push({ rowNumber: r.rowNumber, message: (e as Error).message });
      }
    }
    await batch.commit();
    result.imported += chunk.length - result.errors.length;
  }
  return result;
}

