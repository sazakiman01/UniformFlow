"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered, colors } from "./theme";
import { formatTHB, bahtText } from "@/lib/money";
import { formatAddressLine } from "@/lib/company";
import type { Invoice, CompanyProfile } from "@/types";

interface Props {
  invoice: Invoice;
  company: CompanyProfile;
  /** PNG data URL of PromptPay QR (rendered with `qrcode` library) */
  qrImageDataUrl?: string;
  /** ROOT label override (ต้นฉบับ / สำเนา) */
  copyLabel?: "ต้นฉบับ" | "สำเนา";
}

const TYPE_TITLE: Record<Invoice["type"], { th: string; en: string }> = {
  invoice: { th: "ใบแจ้งหนี้", en: "INVOICE" },
  tax_invoice: { th: "ใบกำกับภาษี", en: "TAX INVOICE" },
  receipt: { th: "ใบเสร็จรับเงิน", en: "RECEIPT" },
  tax_invoice_receipt: { th: "ใบกำกับภาษี / ใบเสร็จรับเงิน", en: "TAX INVOICE / RECEIPT" },
};

export default function InvoicePDF({ invoice, company, qrImageDataUrl, copyLabel = "ต้นฉบับ" }: Props) {
  ensureFontsRegistered();
  const title = TYPE_TITLE[invoice.type];
  const showVAT = invoice.type !== "receipt";
  const isTaxBound = invoice.type === "tax_invoice" || invoice.type === "tax_invoice_receipt";

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        {/* Header */}
        <View style={docStyles.header}>
          <View style={docStyles.companyBlock}>
            {company.logoUrl ? <Image src={company.logoUrl} style={docStyles.logo} /> : null}
            <View>
              <Text style={docStyles.companyName}>{company.name}</Text>
              {company.legalName && company.legalName !== company.name && (
                <Text style={docStyles.smallMuted}>{company.legalName}</Text>
              )}
              <Text style={docStyles.smallMuted}>เลขประจำตัวผู้เสียภาษี: {company.taxId} (สาขา {company.branchCode})</Text>
              <Text style={docStyles.smallMuted}>{formatAddressLine(company.address)}</Text>
              <Text style={docStyles.smallMuted}>
                โทร: {company.phone}
                {company.email ? ` · ${company.email}` : ""}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>{title.th}</Text>
            <Text style={{ fontSize: 9, color: colors.muted }}>{title.en}</Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 4 }}>({copyLabel})</Text>
          </View>
        </View>

        {/* Doc meta */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: `1pt solid ${colors.border}`,
            borderBottom: `1pt solid ${colors.border}`,
            paddingVertical: 6,
            fontSize: 9,
          }}
        >
          <Text>
            <Text style={docStyles.metaLabel}>เลขที่:</Text>
            {invoice.number}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>วันที่:</Text>
            {invoice.issueDate.toLocaleDateString("th-TH")}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>ครบกำหนด:</Text>
            {invoice.dueDate.toLocaleDateString("th-TH")}
          </Text>
        </View>

        {/* Customer */}
        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>ลูกค้า</Text>
            <Text style={docStyles.customerName}>{invoice.customerSnapshot?.name ?? "-"}</Text>
            {invoice.customerSnapshot?.taxId && (
              <Text style={docStyles.smallMuted}>
                TIN: {invoice.customerSnapshot.taxId}
                {invoice.customerSnapshot.branchCode ? ` (สาขา ${invoice.customerSnapshot.branchCode})` : ""}
              </Text>
            )}
            <Text style={docStyles.smallMuted}>
              {formatAddressLine(invoice.customerSnapshot?.address)}
            </Text>
            {invoice.customerSnapshot?.phone && (
              <Text style={docStyles.smallMuted}>โทร: {invoice.customerSnapshot.phone}</Text>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={docStyles.table}>
          <View style={docStyles.tableHead}>
            <Text style={docStyles.cellName}>รายการ</Text>
            <Text style={docStyles.cellQty}>จำนวน</Text>
            <Text style={docStyles.cellUnit}>หน่วย</Text>
            <Text style={docStyles.cellPrice}>ราคา/หน่วย</Text>
            <Text style={docStyles.cellAmount}>รวม</Text>
          </View>
          {invoice.items.map((it, i) => (
            <View key={i} style={docStyles.tableRow}>
              <View style={docStyles.cellName}>
                <Text>{it.productName}</Text>
                {it.description ? <Text style={docStyles.smallMuted}>{it.description}</Text> : null}
              </View>
              <Text style={docStyles.cellQty}>{it.quantity}</Text>
              <Text style={docStyles.cellUnit}>{it.unit ?? ""}</Text>
              <Text style={docStyles.cellPrice}>{formatTHB(it.unitPrice)}</Text>
              <Text style={docStyles.cellAmount}>{formatTHB(it.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals + QR */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          {/* QR + Bank */}
          <View style={{ flex: 1, marginRight: 16 }}>
            {qrImageDataUrl && (
              <View>
                <Text style={docStyles.sectionLabel}>ชำระผ่าน PromptPay</Text>
                <Image src={qrImageDataUrl} style={{ width: 110, height: 110 }} />
                <Text style={{ fontSize: 8, color: colors.muted }}>
                  สแกนเพื่อชำระ {formatTHB(invoice.amountDue)} บาท
                </Text>
              </View>
            )}
            {company.bankAccounts && company.bankAccounts.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={docStyles.sectionLabel}>โอนผ่านธนาคาร</Text>
                {company.bankAccounts.map((b, i) => (
                  <Text key={i} style={{ fontSize: 9 }}>
                    {b.bankName} · {b.accountName} · {b.accountNumber}
                    {b.isDefault ? " (หลัก)" : ""}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Totals */}
          <View style={docStyles.totals}>
            <View style={docStyles.totalRow}>
              <Text style={docStyles.totalLabel}>มูลค่าก่อน VAT</Text>
              <Text style={docStyles.totalValue}>{formatTHB(invoice.netAmount)}</Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={docStyles.totalRow}>
                <Text style={docStyles.totalLabel}>ส่วนลด</Text>
                <Text style={docStyles.totalValue}>−{formatTHB(invoice.discountAmount)}</Text>
              </View>
            )}
            {showVAT && (
              <View style={docStyles.totalRow}>
                <Text style={docStyles.totalLabel}>ภาษีมูลค่าเพิ่ม {invoice.vatRate}%</Text>
                <Text style={docStyles.totalValue}>{formatTHB(invoice.vatAmount)}</Text>
              </View>
            )}
            <View style={docStyles.grandRow}>
              <Text style={docStyles.grandLabel}>รวมทั้งสิ้น</Text>
              <Text style={docStyles.grandValue}>{formatTHB(invoice.grandTotal)}</Text>
            </View>
            {invoice.withholdingTaxAmount && invoice.withholdingTaxAmount > 0 && (
              <>
                <View style={docStyles.totalRow}>
                  <Text style={docStyles.totalLabel}>หัก ณ ที่จ่าย {invoice.withholdingTaxRate}%</Text>
                  <Text style={docStyles.totalValue}>−{formatTHB(invoice.withholdingTaxAmount)}</Text>
                </View>
                <View style={docStyles.grandRow}>
                  <Text style={docStyles.grandLabel}>ยอดสุทธิที่ต้องโอน</Text>
                  <Text style={docStyles.grandValue}>{formatTHB(invoice.amountDue)}</Text>
                </View>
              </>
            )}
            {invoice.amountPaid > 0 && (
              <View style={docStyles.totalRow}>
                <Text style={docStyles.totalLabel}>จ่ายแล้ว</Text>
                <Text style={{ ...docStyles.totalValue, color: "#15803D" }}>
                  {formatTHB(invoice.amountPaid)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={docStyles.bahtTextBox}>
          <Text>(ตัวอักษร: {bahtText(invoice.grandTotal)})</Text>
        </View>

        {invoice.notes && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>หมายเหตุ</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {isTaxBound && (
          <View style={docStyles.notes}>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 6 }}>
              เอกสารนี้เป็นใบกำกับภาษีตามมาตรา 86/4 แห่งประมวลรัษฎากร
            </Text>
          </View>
        )}

        {/* Signatures */}
        <View style={docStyles.signature}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับเงิน</Text>
            {company.signatureUrl && (
              <Image src={company.signatureUrl} style={{ width: 80, height: 30, marginTop: 8 }} />
            )}
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>
              วันที่ {invoice.paidAt ? invoice.paidAt.toLocaleDateString("th-TH") : "___________"}
            </Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับสินค้า/ผู้จ่ายเงิน</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{invoice.customerSnapshot?.name ?? ""}</Text>
            <Text style={{ marginTop: 2, fontSize: 8, color: colors.muted }}>วันที่ ___________</Text>
          </View>
        </View>

        <Text
          style={docStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${company.name} · ${invoice.number} · หน้า ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
