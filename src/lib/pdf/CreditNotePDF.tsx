"use client";

import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { docStyles, ensureFontsRegistered, colors } from "./theme";
import { formatTHB, bahtText } from "@/lib/money";
import { formatAddressLine } from "@/lib/company";
import type { CreditNote, CompanyProfile } from "@/types";

interface Props {
  creditNote: CreditNote;
  company: CompanyProfile;
}

const REASON_LABEL: Record<CreditNote["reasonCategory"], string> = {
  return: "ลูกค้าคืนสินค้า",
  discount: "ส่วนลดเพิ่มเติม",
  price_correction: "แก้ไขราคา",
  cancellation: "ยกเลิกการขาย",
  other: "อื่นๆ",
};

export default function CreditNotePDF({ creditNote, company }: Props) {
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
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={docStyles.docTitle}>ใบลดหนี้ / ใบกำกับภาษี (ลดหนี้)</Text>
            <Text style={{ fontSize: 9, color: colors.muted }}>CREDIT NOTE</Text>
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
            {creditNote.number}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>วันที่:</Text>
            {creditNote.issueDate.toLocaleDateString("th-TH")}
          </Text>
          <Text>
            <Text style={docStyles.metaLabel}>อ้างอิงใบกำกับ:</Text>
            {creditNote.originalInvoiceNumber}
          </Text>
        </View>

        <View style={docStyles.twoCol}>
          <View style={docStyles.col}>
            <Text style={docStyles.sectionLabel}>ลูกค้า</Text>
            <Text style={docStyles.customerName}>{creditNote.customerSnapshot?.name ?? "-"}</Text>
            {creditNote.customerSnapshot?.taxId && (
              <Text style={docStyles.smallMuted}>
                TIN: {creditNote.customerSnapshot.taxId}
                {creditNote.customerSnapshot.branchCode ? ` (${creditNote.customerSnapshot.branchCode})` : ""}
              </Text>
            )}
            <Text style={docStyles.smallMuted}>{formatAddressLine(creditNote.customerSnapshot?.address)}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#FEF3C7",
            border: "1pt solid #F59E0B",
            borderRadius: 4,
            padding: 8,
            marginVertical: 8,
          }}
        >
          <Text style={{ fontWeight: 700, fontSize: 10 }}>เหตุผลในการออกใบลดหนี้:</Text>
          <Text style={{ fontSize: 10, marginTop: 2 }}>
            {REASON_LABEL[creditNote.reasonCategory]} — {creditNote.reason}
          </Text>
        </View>

        <View style={docStyles.table}>
          <View style={docStyles.tableHead}>
            <Text style={docStyles.cellName}>รายการที่ลด</Text>
            <Text style={docStyles.cellQty}>จำนวน</Text>
            <Text style={docStyles.cellUnit}>หน่วย</Text>
            <Text style={docStyles.cellPrice}>ราคา/หน่วย</Text>
            <Text style={docStyles.cellAmount}>รวม</Text>
          </View>
          {creditNote.items.map((it, i) => (
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

        <View style={docStyles.totals}>
          <View style={docStyles.totalRow}>
            <Text style={docStyles.totalLabel}>มูลค่าก่อน VAT</Text>
            <Text style={docStyles.totalValue}>{formatTHB(creditNote.subtotal)}</Text>
          </View>
          <View style={docStyles.totalRow}>
            <Text style={docStyles.totalLabel}>VAT {creditNote.vatRate}%</Text>
            <Text style={docStyles.totalValue}>{formatTHB(creditNote.vatAmount)}</Text>
          </View>
          <View style={docStyles.grandRow}>
            <Text style={docStyles.grandLabel}>ยอดที่ลด</Text>
            <Text style={{ ...docStyles.grandValue, color: "#DC2626" }}>−{formatTHB(creditNote.grandTotal)}</Text>
          </View>
        </View>

        <View style={docStyles.bahtTextBox}>
          <Text>(ตัวอักษร: ลด {bahtText(creditNote.grandTotal)})</Text>
        </View>

        <View style={docStyles.notes}>
          <Text style={{ fontSize: 8, color: colors.muted, marginTop: 6 }}>
            ใบลดหนี้นี้ออกตามมาตรา 86/10 แห่งประมวลรัษฎากร — ใช้เพื่อปรับปรุงภาษีขาย
          </Text>
        </View>

        <View style={docStyles.signature}>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้ออกใบลดหนี้</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{company.name}</Text>
          </View>
          <View style={docStyles.sigBox}>
            <Text style={{ color: colors.muted }}>ผู้รับเอกสาร</Text>
            <View style={docStyles.sigLine} />
            <Text style={{ marginTop: 2 }}>{creditNote.customerSnapshot?.name ?? ""}</Text>
          </View>
        </View>

        <Text
          style={docStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `${company.name} · ${creditNote.number} · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
