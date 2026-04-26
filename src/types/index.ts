// User (Firestore mirror of Firebase Auth + metadata)
// 4-role model.
export type UserRole = 'owner' | 'accountant' | 'staff' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'เจ้าของกิจการ',
  accountant: 'ฝ่ายบัญชี',
  staff: 'พนักงาน',
  viewer: 'ผู้ดู (Read-only)',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'จัดการได้ทุกอย่าง รวมผู้ใช้ และข้อมูลบริษัท',
  accountant: 'จัดการเอกสารการเงิน รายงาน และค่าใช้จ่าย',
  staff: 'จัดการใบส่งของ และดูเอกสารอื่น ๆ',
  viewer: 'ดูข้อมูลอย่างเดียว ไม่สามารถแก้ไขได้',
};

/** Returns true if role can manage finance (invoice, expense, reports) */
export function canManageFinance(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'accountant';
}

/** Returns true if role can view finance reports */
export function canViewFinance(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'accountant' || role === 'viewer' || role === 'staff';
}

/** Returns true if role can manage operations (delivery notes) */
export function canManageOperations(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'accountant' || role === 'staff';
}

export interface UserProfile {
  id: string;              // Firebase Auth uid
  email: string;
  displayName?: string;
  role: UserRole;
  disabled: boolean;
  lineUserId?: string;     // Phase 2
  invitedBy?: string;      // uid of admin who invited
  createdAt: Date;
  updatedAt: Date;
}

// Invite
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  token: string;           // 32-char random
  status: InviteStatus;
  expiresAt: Date;
  createdBy: string;       // admin uid
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;     // user uid
}

// Customer
export type CustomerType = 'individual' | 'corporate';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lineUserId?: string;
  email?: string;
  address: Address;
  channel: 'L' | 'F' | 'OTHER';
  // ── Tax / Accounting fields ──
  taxId?: string;                  // 13-digit TIN (corporate or individual)
  customerType?: CustomerType;     // default 'individual'
  branchCode?: string;             // '00000' = head office
  creditTerm?: number;             // days, default 0 (cash)
  defaultBillingAddress?: Address; // optional override of address for tax docs
  contactPerson?: string;          // ผู้ติดต่อ (สำหรับนิติบุคคล)
  notes?: string;
  // ── Opening balance (imported from previous accounting system) ──
  openingBalance?: number;         // ยอดลูกหนี้คงค้าง ณ วันเริ่มใช้ระบบ
  openingBalanceAsOf?: Date;       // วันตัดยอด
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  district: string;
  province: string;
  postcode: string;
  fullAddress: string;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCOUNTING / FINANCE / TAX (FlowAccount Replacement)
// ════════════════════════════════════════════════════════════════════════════

// ── Company Profile (Singleton) ─────────────────────────────────────────────
export interface CompanyProfile {
  id: string;                     // typically 'main' (singleton)
  companyId?: string;             // reserved for future multi-tenant
  name: string;                   // ชื่อกิจการ
  legalName?: string;             // ชื่อจดทะเบียน
  taxId: string;                  // 13-digit TIN
  branchCode: string;             // default '00000'
  address: Address;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  signatureUrl?: string;          // ลายเซ็น
  stampUrl?: string;              // ตราประทับ
  vatRegistered: boolean;         // จด VAT?
  vatRate: number;                // default 7
  defaultCreditTerm: number;      // days, default 0
  // PromptPay
  promptPayId?: string;           // เบอร์โทรหรือเลข TIN
  promptPayType?: 'phone' | 'tax_id' | 'ewallet';
  // Bank
  bankAccounts?: BankAccount[];
  // Document numbering preferences
  documentNumberingMode?: 'monthly' | 'yearly';  // default 'monthly'
  // Fiscal
  fiscalYearStartMonth?: number;  // 1-12, default 1 (January)
  // ── Opening balances (เมื่อเริ่มใช้ระบบ) ──
  systemStartDate?: Date;         // วันที่เริ่มใช้ระบบนี้
  cashOpeningBalance?: number;    // ยอดเงินสดต้นงวด
  bankOpeningBalances?: Record<string, number>; // key = accountNumber, value = ยอดต้นงวด
  openingBalanceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  isDefault?: boolean;
}

// ── Document Counter (transaction-safe auto-numbering) ──────────────────────
export type DocumentType =
  | 'quotation'
  | 'invoice'
  | 'tax_invoice'
  | 'receipt'
  | 'credit_note'
  | 'delivery_note'
  | 'expense'
  | 'wht_certificate';

export interface DocumentCounter {
  id: string;                     // e.g., 'invoice-2026-04' or 'invoice-2026'
  type: DocumentType;
  year: number;
  month?: number;                 // optional if yearly mode
  lastNumber: number;             // last issued number
  prefix: string;                 // e.g., 'INV', 'QT', 'TAX', 'RC', 'CN', 'DN', 'EX', 'WHT'
  updatedAt: Date;
}

// ── Common Line Item for documents ──────────────────────────────────────────
export interface DocumentLineItem {
  productName: string;
  description?: string;
  quantity: number;
  unit?: string;                  // ตัว, ชิ้น, โหล
  unitPrice: number;              // ราคาต่อหน่วย (excl. VAT if priceMode='exclusive')
  discount?: number;              // amount discount on this line
  total: number;                  // quantity * unitPrice - discount
  // Optional product link
  productId?: string;
  // Optional order/production link
  orderId?: string;
  orderItemIndex?: number;
}

export type PriceMode = 'inclusive' | 'exclusive';  // ราคารวม VAT หรือไม่

// ── Audit Trail (for tax-bound documents) ───────────────────────────────────
export interface AuditEntry {
  action: 'create' | 'update' | 'send' | 'cancel' | 'pay' | 'replace';
  by: string;                     // uid
  byName?: string;                // displayName at time
  at: Date;
  reason?: string;
  // Optional snapshot for critical changes
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

// ── Quotation (ใบเสนอราคา) ──────────────────────────────────────────────────
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quotation {
  id: string;
  number: string;                 // QT-2026-04-0001
  customerId: string;
  customerSnapshot?: CustomerSnapshot;  // freeze customer info at issue time
  items: DocumentLineItem[];
  priceMode: PriceMode;
  subtotal: number;
  discountAmount: number;
  vatRate: number;                // 7
  vatAmount: number;
  grandTotal: number;
  validUntil: Date;
  notes?: string;
  termsAndConditions?: string;
  status: QuotationStatus;
  convertedToInvoiceId?: string;
  pdfUrl?: string;
  sentAt?: Date;
  acceptedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  auditLog?: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// Customer snapshot (frozen at issue time for legal documents)
export interface CustomerSnapshot {
  name: string;
  taxId?: string;
  customerType?: CustomerType;
  branchCode?: string;
  address: Address;
  phone?: string;
  email?: string;
}

// ── Invoice / Tax Invoice / Receipt (ใบกำกับภาษี/ใบเสร็จ) ───────────────────
export type InvoiceType =
  | 'invoice'                     // ใบแจ้งหนี้ (ยังไม่จ่าย ยังไม่ใช่ใบกำกับภาษี)
  | 'tax_invoice'                 // ใบกำกับภาษี
  | 'receipt'                     // ใบเสร็จรับเงิน (ไม่มี VAT)
  | 'tax_invoice_receipt';        // ใบกำกับภาษี/ใบเสร็จรับเงิน (รวม)

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'                     // จ่ายบางส่วน
  | 'paid'                        // จ่ายครบ
  | 'overdue'
  | 'cancelled'
  | 'void';                       // ยกเลิกหลังออกใบกำกับภาษี → ต้องออก credit note

export interface Invoice {
  id: string;
  number: string;                 // TAX-2026-04-0001
  type: InvoiceType;
  customerId: string;
  customerSnapshot?: CustomerSnapshot;
  // Source links
  orderId?: string;
  quotationId?: string;
  // Line items
  items: DocumentLineItem[];
  priceMode: PriceMode;
  // Money
  subtotal: number;               // before discount, before VAT
  discountAmount: number;
  netAmount: number;              // subtotal - discount
  vatRate: number;                // 0 or 7
  vatAmount: number;
  withholdingTaxRate?: number;    // 0, 1, 2, 3, 5
  withholdingTaxAmount?: number;
  grandTotal: number;             // net + vat
  amountPaid: number;             // sum of payments
  amountDue: number;              // grandTotal - amountPaid - WHT
  // Dates
  issueDate: Date;
  dueDate: Date;
  // Status
  status: InvoiceStatus;
  // Payment
  paymentMethod?: 'transfer' | 'cash' | 'qr' | 'cheque' | 'credit';
  paidAt?: Date;
  // QR
  qrCodeData?: string;            // PromptPay QR data string
  // PDFs
  pdfUrl?: string;
  // Cancellation
  cancelledAt?: Date;
  cancelledReason?: string;
  cancelledBy?: string;
  replacedByInvoiceId?: string;
  creditNoteId?: string;
  // Notes
  notes?: string;
  internalNotes?: string;
  // Sent
  sentAt?: Date;
  sentTo?: string[];
  // Audit
  createdBy: string;
  updatedBy?: string;
  auditLog?: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Payment Record (linked to Invoice) ──────────────────────────────────────
export type PaymentMethod = 'transfer' | 'cash' | 'qr' | 'cheque' | 'credit_card' | 'other';

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
  // Bank details
  bankName?: string;
  bankRef?: string;
  // Slip
  slipImage?: string;
  // WHT
  withholdingTaxAmount?: number;
  withholdingTaxRate?: number;
  whtCertificateNumber?: string;
  // Verification
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  // Notes
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// ── Credit Note (ใบลดหนี้) ──────────────────────────────────────────────────
export interface CreditNote {
  id: string;
  number: string;                 // CN-2026-04-0001
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId: string;
  customerSnapshot?: CustomerSnapshot;
  reason: string;                 // เหตุผลในการออกใบลดหนี้ (กฎหมายบังคับ)
  reasonCategory: 'return' | 'discount' | 'price_correction' | 'cancellation' | 'other';
  items: DocumentLineItem[];
  priceMode: PriceMode;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  issueDate: Date;
  pdfUrl?: string;
  status: 'draft' | 'issued' | 'sent';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Delivery Note (ใบส่งของ) ────────────────────────────────────────────────
export interface DeliveryNote {
  id: string;
  number: string;                 // DN-2026-04-0001
  invoiceId?: string;
  orderId?: string;
  customerId: string;
  customerSnapshot?: CustomerSnapshot;
  items: Array<Omit<DocumentLineItem, 'unitPrice' | 'discount' | 'total'>>;
  deliveryDate: Date;
  deliveryAddress: Address;
  trackingNo?: string;
  carrier?: string;               // Flash, J&T, Kerry
  receivedBy?: string;
  receivedAt?: Date;
  signatureUrl?: string;
  pdfUrl?: string;
  status: 'draft' | 'shipped' | 'delivered';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Expense (ค่าใช้จ่าย / Purchase) ──────────────────────────────────────────
export type ExpenseCategory =
  | 'fabric'                      // ผ้า
  | 'thread'                      // ด้าย/ปัก
  | 'accessories'                 // กระดุม/ซิป/ป้าย
  | 'shipping'                    // ค่าขนส่ง
  | 'labor'                       // ค่าแรงช่าง
  | 'rent'                        // ค่าเช่า
  | 'utility'                     // ค่าน้ำค่าไฟ
  | 'marketing'                   // โฆษณา
  | 'office'                      // เครื่องเขียน
  | 'equipment'                   // เครื่องจักร/อุปกรณ์
  | 'travel'                      // ค่าเดินทาง
  | 'fee'                         // ค่าธรรมเนียม
  | 'tax'                         // ภาษี
  | 'other';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fabric: 'ผ้า',
  thread: 'ด้าย/ปัก',
  accessories: 'กระดุม/ซิป/ป้าย',
  shipping: 'ค่าขนส่ง',
  labor: 'ค่าแรงช่าง',
  rent: 'ค่าเช่า',
  utility: 'ค่าน้ำค่าไฟ',
  marketing: 'การตลาด',
  office: 'สำนักงาน',
  equipment: 'อุปกรณ์',
  travel: 'ค่าเดินทาง',
  fee: 'ค่าธรรมเนียม',
  tax: 'ภาษี',
  other: 'อื่นๆ',
};

export interface Expense {
  id: string;
  number: string;                 // EX-2026-04-0001
  category: ExpenseCategory;
  description: string;
  // Supplier
  supplier?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  // Money
  amount: number;                 // before VAT
  vatRate?: number;               // 0 or 7
  vatAmount?: number;
  totalAmount: number;            // amount + vat
  // Withholding tax (ที่เราหัก ณ ที่จ่าย ตอนจ่ายให้ supplier)
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  whtCertificateId?: string;      // link to WHTCertificate doc we issued
  // Tax invoice from supplier (สำหรับเครม VAT)
  isPurchaseTaxClaim: boolean;    // เครม VAT ซื้อ ภพ.30 ได้?
  supplierTaxInvoiceNumber?: string;
  supplierTaxInvoiceDate?: Date;
  // Payment
  paymentMethod: PaymentMethod;
  paidAt: Date;
  bankRef?: string;
  // Attachments
  receiptImage?: string;
  attachments?: string[];
  // Cost allocation
  relatedOrderId?: string;        // for COGS tracking
  isCOGS: boolean;                // นับเป็นต้นทุนสินค้า?
  // Audit
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Withholding Tax Certificate (หนังสือรับรองหัก ณ ที่จ่าย) ────────────────
export type WHTType = 'pnd1' | 'pnd2' | 'pnd3' | 'pnd53';
export type WHTPayeeType = 'individual' | 'corporate';

export interface WHTCertificate {
  id: string;
  number: string;                 // WHT-2026-04-0001
  type: WHTType;                  // form type
  // Payee (ผู้รับเงิน — ผู้ที่เราหัก)
  payeeId?: string;               // Customer or supplier ID
  payeeName: string;
  payeeTaxId: string;
  payeeAddress: string;
  payeeType: WHTPayeeType;
  // Income detail
  incomeType: string;             // ประเภทเงินได้ (40(2), 40(3), 40(8), etc.)
  incomeTypeCode: string;
  paidAmount: number;             // ยอดที่จ่าย
  taxRate: number;                // % เช่น 1, 2, 3, 5
  taxAmount: number;              // ภาษีที่หัก
  // Date
  paidDate: Date;
  issueDate: Date;
  // Source
  expenseId?: string;
  // PDF
  pdfUrl?: string;
  // Audit
  createdBy: string;
  createdAt: Date;
}

// ── Tax Reports (computed views — not stored, but cached optionally) ────────
export interface VATInvoiceLine {
  invoiceId: string;
  number: string;
  issueDate: Date;
  customerName: string;
  customerTaxId?: string;
  netAmount: number;
  vatAmount: number;
}

export interface VATExpenseLine {
  expenseId: string;
  number: string;
  paidAt: Date;
  supplierName: string;
  supplierTaxId?: string;
  supplierTaxInvoiceNumber?: string;
  amount: number;
  vatAmount: number;
}

export interface VATReport {
  // ภพ.30
  period: { year: number; month: number };
  output: {
    base: number;
    vat: number;
    invoiceCount: number;
    invoices: VATInvoiceLine[];
  };
  input: {
    base: number;
    vat: number;
    expenseCount: number;
    expenses: VATExpenseLine[];
  };
  vatDue: number;                 // output - input (positive = ชำระ, negative = ขอคืน)
  isRefund: boolean;
  generatedAt: Date;
}

export interface WHTReport {
  // ภงด.3 (individual) or ภงด.53 (corporate)
  type: WHTType;
  period: { year: number; month: number };
  entries: WHTCertificate[];
  totalTaxWithheld: number;
  totalIncome: number;
  generatedAt: Date;
}

// ── Profit & Loss / Cash Flow (computed) ────────────────────────────────────
export interface PLReport {
  period: { from: Date; to: Date };
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPct: number;
  expensesByCategory: Record<string, number>;
  generatedAt: Date;
}

export interface CashFlowReport {
  period: { from: Date; to: Date };
  inflow: { total: number; payments: number; other: number };
  outflow: { total: number; expenses: number; other: number };
  net: number;
  generatedAt: Date;
}

// ── AR Aging ────────────────────────────────────────────────────────────────
export type ARAgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface ARAgingItem {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  overdueDays: number;
  amountDue: number;
  bucket: ARAgingBucket;
}

export interface ARAgingReport {
  asOf: Date;
  items: ARAgingItem[];
  buckets: Record<ARAgingBucket, number>;
  totalDue: number;
}
