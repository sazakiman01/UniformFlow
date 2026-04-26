"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered, colors } from "./theme";
import { formatTHB, bahtText } from "@/lib/money";
import { formatAddressLine } from "@/lib/company";
import type { Receipt } from "@/lib/receipts";
import type { CompanyProfile } from "@/types";

const PAYMENT_LABEL: Record<string, string> = {
  cash: "เงินสด",
  transfer: "โอนเงิน",
  qr: "QR / PromptPay",
  cheque: "เช็ค",
  credit_card: "บัตรเครดิต",
  other: "อื่นๆ",
};

export default function ReceiptPDF({ receipt, company }: { receipt: Receipt; company: CompanyProfile }) {
  ensureFontsRegistered();

  return (
    <Document>
      <Page size="A4" style={docStyles.page}>
        <View style={docStyles.header}>
          <View style={docStyles.companyBlock}>
            {company.logoUrl ? <Image src={company.logoUrl} style={docStyles.logo} /> : null}
            <View>
              <Text style={docStyles.companyName}>{company.name}</Text>
              <Text style={docStyles.smallMuted}>เลขประจำตัวผู้เสียภาษี: {company.taxId}</Text>
              <Text style={docStyles.smallMuted}>{formatAddressLine(company.address)}</Text>
              <Text style={docStyles.smallMuted}>โทร: {company.phone}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>ใบเสร็จรับเงิน</Text>
            <Text style={{ fontSize: 9, color: colors.muted }}>RECEIPT</Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 4 }}>(ต้นฉบับ)</Text>
          </View>
        </View>

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
            {receipt.number}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>วันที่:</Text>
            {receipt.issueDate.toLocaleDateString("th-TH")}
          </Text>
          {receipt.invoiceNumber && (
            <Text>
              <Text style={docStyles.metaLabel}>อ้างอิงใบกำกับ:</Text>
              {receipt.invoiceNumber}
            </Text>
          )}
        </View>

        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>รับเงินจาก</Text>
            <Text style={docStyles.customerName}>{receipt.customerSnapshot?.name ?? "-"}</Text>
            {receipt.customerSnapshot?.taxId && (
              <Text style={docStyles.smallMuted}>TIN: {receipt.customerSnapshot.taxId}</Text>
            )}
            <Text style={docStyles.smallMuted}>{formatAddressLine(receipt.customerSnapshot?.address)}</Text>
          </View>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>วิธีรับชำระ</Text>
            <Text style={{ fontWeight: 700 }}>{PAYMENT_LABEL[receipt.paymentMethod] ?? receipt.paymentMethod}</Text>
            {receipt.bankRef && (
              <Text style={{ fontSize: 9, color: colors.muted }}>อ้างอิง: {receipt.bankRef}</Text>
            )}
          </View>
        </View>

        <View
          style={{
            border: `1pt solid ${colors.border}`,
            borderRadius: 4,
            padding: 10,
            marginVertical: 10,
          }}
        >
          <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4 }}>รายการ</Text>
          <Text style={{ fontSize: 11 }}>{receipt.description}</Text>
        </View>

        <View
          style={{
            backgroundColor: "#F0FDF4",
            border: `1pt solid #16A34A`,
            borderRadius: 4,
            padding: 12,
            marginVertical: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 10, color: colors.muted }}>ยอดรับเงิน</Text>
          <Text style={{ fontSize: 22, fontWeight: 700, color: "#16A34A", marginTop: 2 }}>
            {formatTHB(receipt.amount)}
          </Text>
          <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }}>
            ({bahtText(receipt.amount)})
          </Text>
        </View>

        {receipt.notes && (
          <View style={docStyles.notes}>
            <Text style={docStyles.sectionLabel}>หมายเหตุ</Text>
            <Text>{receipt.notes}</Text>
          </View>
        )}

        <View style={{ ...docStyles.signature, marginTop: 30 }}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับเงิน</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้จ่ายเงิน</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{receipt.customerSnapshot?.name ?? "________________"}</Text>
          </View>
        </View>

        <Text
          style={docStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${company.name} · ${receipt.number} · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
